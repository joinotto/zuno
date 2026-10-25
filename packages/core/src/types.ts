// SPDX-License-Identifier: Apache-2.0

export type Fetch = typeof globalThis.fetch
export type MaybePromise<T> = Promise<T> | T
export type ResponseMode = 'data' | 'full'

export interface RateLimitMetadata {
  limit?: number | undefined
  remaining?: number | undefined
  resetAt?: Date | undefined
}

export interface RequestMetadata {
  attempts: number
  operation: string
  provider: string
  rateLimit?: RateLimitMetadata | undefined
  requestId?: string | undefined
  status: number
}

export interface FullResponse<T> {
  data: T
  metadata: RequestMetadata
  raw: Response
}

export interface RetryPolicy {
  baseDelayMs: number
  maxAttempts: number
  maxDelayMs: number
  retryStatusCodes: ReadonlySet<number>
}

export interface RequestContext {
  attempt: number
  method: string
  operation: string
  provider: string
  url: URL
}

export interface ResponseContext extends RequestContext {
  metadata: RequestMetadata
  response: Response
}

export interface RetryContext extends RequestContext {
  delayMs: number
  error: unknown
}

export interface ErrorContext extends RequestContext {
  error: unknown
}

export interface TransportHooks {
  onError?: (context: ErrorContext) => MaybePromise<void>
  onRequest?: (context: RequestContext) => MaybePromise<void>
  onResponse?: (context: ResponseContext) => MaybePromise<void>
  onRetry?: (context: RetryContext) => MaybePromise<void>
}

export interface TransportOptions {
  baseUrl: string | URL
  defaultHeaders?: HeadersInit
  fetch?: Fetch
  hooks?: TransportHooks
  provider: string
  retry?: Partial<RetryPolicy>
  timeoutMs?: number
}

export interface TransportRequest {
  idempotencyKey?: string
  init?: RequestInit
  operation: string
  parse?: (response: Response) => Promise<unknown>
  path: string | URL
  response?: ResponseMode
}

export interface Transport {
  request<T>(request: TransportRequest & { response: 'full' }): Promise<FullResponse<T>>
  request<T>(request: TransportRequest & { response?: 'data' }): Promise<T>
}
