// SPDX-License-Identifier: Apache-2.0

import { redact } from '@ottoai/zuno'
import type { MaybePromise } from '@ottoai/zuno'

const sensitiveHeaders = new Set([
  'authorization',
  'cookie',
  'intuit-signature',
  'proxy-authorization',
  'set-cookie',
  'x-api-key',
])
const sensitiveQueryParameters = /(?:code|key|secret|signature|token)$/iu

export interface RecordedHttpRequest {
  body?: unknown
  headers: Record<string, string>
  method: string
  url: string
}

export interface RecordedHttpResponse {
  body?: unknown
  headers: Record<string, string>
  status: number
  statusText: string
}

export interface HttpRecording {
  request: RecordedHttpRequest
  response: RecordedHttpResponse
}

export interface RecordingFetchOptions {
  fetch: typeof globalThis.fetch
  includeTextBodies?: boolean
  onRecord: (recording: HttpRecording) => MaybePromise<void>
}

export interface ReplayFetch {
  fetch: typeof globalThis.fetch
  remaining(): number
}

export function createRecordingFetch(options: RecordingFetchOptions): typeof globalThis.fetch {
  return async (input, init) => {
    const request = new Request(input, init)
    const requestRecording = await recordRequest(request, options.includeTextBodies ?? false)
    const response = await options.fetch(input, init)
    const responseRecording = await recordResponse(response, options.includeTextBodies ?? false)

    await options.onRecord({
      request: requestRecording,
      response: responseRecording,
    })

    return response
  }
}

export function createReplayFetch(recordings: readonly HttpRecording[]): ReplayFetch {
  const queue = recordings.map(cloneRecording)

  const fetchImplementation: typeof globalThis.fetch = async (input, init) => {
    const request = new Request(input, init)
    const recordedRequest = await recordRequest(request, true)
    const index = queue.findIndex((recording) => requestsMatch(recording.request, recordedRequest))

    if (index === -1) {
      throw new Error(`No HTTP recording matches ${recordedRequest.method} ${recordedRequest.url}.`)
    }

    const [recording] = queue.splice(index, 1)

    if (recording === undefined) {
      throw new Error('The matched HTTP recording is not available.')
    }

    return createRecordedResponse(recording.response)
  }

  return {
    fetch: fetchImplementation,
    remaining: () => queue.length,
  }
}

async function recordRequest(
  request: Request,
  includeTextBodies: boolean,
): Promise<RecordedHttpRequest> {
  return {
    body: await recordBody(request.clone(), includeTextBodies),
    headers: recordHeaders(request.headers),
    method: request.method.toUpperCase(),
    url: redactUrl(request.url),
  }
}

async function recordResponse(
  response: Response,
  includeTextBodies: boolean,
): Promise<RecordedHttpResponse> {
  return {
    body: await recordBody(response.clone(), includeTextBodies),
    headers: recordHeaders(response.headers),
    status: response.status,
    statusText: response.statusText,
  }
}

async function recordBody(
  message: Request | Response,
  includeTextBodies: boolean,
): Promise<unknown> {
  const text = await message.text()

  if (text === '') {
    return undefined
  }

  const contentType = message.headers.get('content-type')

  if (contentType?.includes('json') === true) {
    try {
      return redact(JSON.parse(text) as unknown)
    } catch {
      return includeTextBodies ? text : undefined
    }
  }

  return includeTextBodies ? text : undefined
}

function recordHeaders(headers: Headers): Record<string, string> {
  return Object.fromEntries(
    [...headers.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, value]) => [name, sensitiveHeaders.has(name) ? '[REDACTED]' : value]),
  )
}

function redactUrl(value: string): string {
  const url = new URL(value)

  for (const key of url.searchParams.keys()) {
    if (sensitiveQueryParameters.test(key)) {
      url.searchParams.set(key, '[REDACTED]')
    }
  }

  return url.href
}

function requestsMatch(left: RecordedHttpRequest, right: RecordedHttpRequest): boolean {
  return (
    left.method === right.method &&
    left.url === right.url &&
    JSON.stringify(left.body) === JSON.stringify(right.body)
  )
}

function createRecordedResponse(recording: RecordedHttpResponse): Response {
  const body =
    recording.body === undefined
      ? null
      : typeof recording.body === 'string'
        ? recording.body
        : JSON.stringify(recording.body)

  return new Response(body, {
    headers: recording.headers,
    status: recording.status,
    statusText: recording.statusText,
  })
}

function cloneRecording(recording: HttpRecording): HttpRecording {
  return structuredClone(recording)
}
