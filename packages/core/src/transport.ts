// SPDX-License-Identifier: Apache-2.0

import {
  AuthenticationError,
  AuthorizationError,
  ConnectionError,
  ProviderApiError,
  RateLimitError,
  TimeoutError,
} from './errors.js'
import { redact } from './redact.js'
import { createRetryPolicy, getRetryDelay } from './retry.js'
import type {
  FullResponse,
  RequestContext,
  RequestMetadata,
  RetryPolicy,
  Transport,
  TransportOptions,
  TransportRequest,
} from './types.js'

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS'])

export function createTransport(options: TransportOptions): Transport {
  const fetchImplementation = options.fetch ?? globalThis.fetch
  const retryPolicy = createRetryPolicy(options.retry)
  const timeoutMs = options.timeoutMs ?? 30_000

  async function request<T>(
    requestOptions: TransportRequest & { response: 'full' },
  ): Promise<FullResponse<T>>
  async function request<T>(requestOptions: TransportRequest & { response?: 'data' }): Promise<T>
  async function request<T>(requestOptions: TransportRequest): Promise<FullResponse<T> | T> {
    const method = requestOptions.init?.method?.toUpperCase() ?? 'GET'
    const url = createUrl(options.baseUrl, requestOptions.path)
    const canRetry = safeMethods.has(method) || requestOptions.idempotencyKey !== undefined

    for (let attempt = 1; attempt <= retryPolicy.maxAttempts; attempt += 1) {
      const context: RequestContext = {
        attempt,
        method,
        operation: requestOptions.operation,
        provider: options.provider,
        url,
      }

      await options.hooks?.onRequest?.(context)

      try {
        const response = await executeRequest(
          fetchImplementation,
          url,
          createRequestInit(options, requestOptions),
          timeoutMs,
          context,
        )

        const metadata = createMetadata(
          options.provider,
          requestOptions.operation,
          attempt,
          response,
        )

        if (!response.ok) {
          const error = await createProviderError(context, response, metadata)

          if (
            canRetry &&
            attempt < retryPolicy.maxAttempts &&
            retryPolicy.retryStatusCodes.has(response.status)
          ) {
            await retry(context, error, retryPolicy, response.headers.get('retry-after'), options)
            continue
          }

          await options.hooks?.onError?.({ ...context, error })
          throw error
        }

        const raw = response.clone()
        const data = (await parseResponse(response, requestOptions.parse)) as T
        await options.hooks?.onResponse?.({ ...context, metadata, response: raw })

        if ((requestOptions.response ?? 'data') === 'full') {
          return { data, metadata, raw }
        }

        return data
      } catch (error) {
        if (error instanceof ProviderApiError) {
          throw error
        }

        const connectionError =
          error instanceof TimeoutError
            ? error
            : new ConnectionError('The provider request failed.', {
                cause: error,
                operation: context.operation,
                provider: context.provider,
                retryable: canRetry,
              })

        if (canRetry && attempt < retryPolicy.maxAttempts) {
          await retry(context, connectionError, retryPolicy, null, options)
          continue
        }

        await options.hooks?.onError?.({ ...context, error: connectionError })
        throw connectionError
      }
    }

    throw new ConnectionError('The provider request did not complete.', {
      operation: requestOptions.operation,
      provider: options.provider,
    })
  }

  return { request }
}

function createUrl(baseUrl: string | URL, path: string | URL): URL {
  if (path instanceof URL) {
    return new URL(path)
  }

  try {
    return new URL(path)
  } catch {
    const normalizedBase = baseUrl.toString().endsWith('/') ? baseUrl : `${baseUrl.toString()}/`
    return new URL(path.replace(/^\/+/u, ''), normalizedBase)
  }
}

function createRequestInit(options: TransportOptions, request: TransportRequest): RequestInit {
  const headers = new Headers(options.defaultHeaders)

  for (const [key, value] of new Headers(request.init?.headers)) {
    headers.set(key, value)
  }

  if (request.idempotencyKey !== undefined && !headers.has('idempotency-key')) {
    headers.set('idempotency-key', request.idempotencyKey)
  }

  return {
    ...request.init,
    headers,
  }
}

async function executeRequest(
  fetchImplementation: typeof globalThis.fetch,
  url: URL,
  init: RequestInit,
  timeoutMs: number,
  context: RequestContext,
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const abort = () => controller.abort(init.signal?.reason)
  init.signal?.addEventListener('abort', abort, { once: true })

  try {
    return await fetchImplementation(url, {
      ...init,
      signal: controller.signal,
    })
  } catch (error) {
    if (controller.signal.aborted && !init.signal?.aborted) {
      throw new TimeoutError('The provider request timed out.', {
        cause: error,
        operation: context.operation,
        provider: context.provider,
        retryable: true,
      })
    }

    throw error
  } finally {
    clearTimeout(timeout)
    init.signal?.removeEventListener('abort', abort)
  }
}

async function parseResponse(
  response: Response,
  parser: TransportRequest['parse'],
): Promise<unknown> {
  if (parser !== undefined) {
    return parser(response)
  }

  if (response.status === 204) {
    return undefined
  }

  const contentType = response.headers.get('content-type')

  if (contentType?.includes('application/json') === true) {
    return response.json()
  }

  return response.text()
}

function createMetadata(
  provider: string,
  operation: string,
  attempts: number,
  response: Response,
): RequestMetadata {
  const limit = parseHeaderNumber(response.headers.get('x-ratelimit-limit'))
  const remaining = parseHeaderNumber(response.headers.get('x-ratelimit-remaining'))
  const reset = response.headers.get('x-ratelimit-reset')
  const resetAt = reset === null ? undefined : parseResetDate(reset)
  const rateLimit =
    limit === undefined && remaining === undefined && resetAt === undefined
      ? undefined
      : { limit, remaining, resetAt }

  return {
    attempts,
    operation,
    provider,
    rateLimit,
    requestId:
      response.headers.get('intuit_tid') ??
      response.headers.get('x-request-id') ??
      response.headers.get('request-id') ??
      undefined,
    status: response.status,
  }
}

function parseHeaderNumber(value: string | null): number | undefined {
  if (value === null) {
    return undefined
  }

  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

function parseResetDate(value: string): Date | undefined {
  const numeric = Number(value)
  const date = Number.isFinite(numeric)
    ? new Date(numeric < 10_000_000_000 ? numeric * 1_000 : numeric)
    : new Date(value)

  return Number.isNaN(date.getTime()) ? undefined : date
}

async function createProviderError(
  context: RequestContext,
  response: Response,
  metadata: RequestMetadata,
): Promise<ProviderApiError> {
  const body = redact(await parseErrorBody(response))
  const errorOptions = {
    body,
    operation: context.operation,
    provider: context.provider,
    requestId: metadata.requestId,
    retryable: response.status === 408 || response.status === 429 || response.status >= 500,
    status: response.status,
  }

  if (response.status === 401) {
    return new AuthenticationError('Provider authentication failed.', errorOptions)
  }

  if (response.status === 403) {
    return new AuthorizationError('Provider authorization failed.', errorOptions)
  }

  if (response.status === 429) {
    return new RateLimitError('The provider rate limit was exceeded.', errorOptions)
  }

  return new ProviderApiError('The provider returned an error.', errorOptions)
}

async function parseErrorBody(response: Response): Promise<unknown> {
  const text = await response.text()

  if (text === '') {
    return undefined
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

async function retry(
  context: RequestContext,
  error: unknown,
  policy: RetryPolicy,
  retryAfter: string | null,
  options: TransportOptions,
): Promise<void> {
  const delayMs = getRetryDelay(context.attempt, policy, retryAfter)
  await options.hooks?.onRetry?.({ ...context, delayMs, error })
  await new Promise((resolve) => setTimeout(resolve, delayMs))
}
