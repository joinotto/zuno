// SPDX-License-Identifier: Apache-2.0

export interface ZunoErrorOptions extends ErrorOptions {
  operation: string
  provider: string
  retryable?: boolean
}

export class ZunoError extends Error {
  readonly operation: string
  readonly provider: string
  readonly retryable: boolean

  constructor(message: string, options: ZunoErrorOptions) {
    super(message, options)
    this.name = new.target.name
    this.operation = options.operation
    this.provider = options.provider
    this.retryable = options.retryable ?? false
  }
}

export interface ProviderApiErrorOptions extends ZunoErrorOptions {
  body?: unknown
  requestId?: string | undefined
  status: number
}

export class ProviderApiError extends ZunoError {
  readonly body: unknown
  readonly requestId: string | undefined
  readonly status: number

  constructor(message: string, options: ProviderApiErrorOptions) {
    super(message, options)
    this.body = options.body
    this.requestId = options.requestId
    this.status = options.status
  }
}

export class AuthenticationError extends ProviderApiError {}
export class AuthorizationError extends ProviderApiError {}
export class RateLimitError extends ProviderApiError {}
export class ValidationError extends ZunoError {}
export class TimeoutError extends ZunoError {}
export class ConnectionError extends ZunoError {}
