// SPDX-License-Identifier: Apache-2.0

import { ProviderApiError, ZunoError } from '@ottoai/zuno'
import type { PlaidApiErrorBody } from './types.js'

export class PlaidApiError extends ProviderApiError {
  readonly errorCode: string | undefined
  readonly errorCodeReason: string | undefined
  readonly errorType: string | undefined

  constructor(body: PlaidApiErrorBody, status: number, operation: string) {
    super(body.error_message ?? 'Plaid returned an error.', {
      body,
      operation,
      provider: 'plaid',
      requestId: body.request_id,
      status,
    })
    this.errorCode = body.error_code
    this.errorCodeReason = body.error_code_reason
    this.errorType = body.error_type
  }

  get requiresUpdateMode(): boolean {
    return (
      this.errorCode === 'ITEM_LOGIN_REQUIRED' ||
      this.errorCode === 'USER_PERMISSION_REVOKED' ||
      this.errorCodeReason === 'OAUTH_CONSENT_EXPIRED' ||
      this.errorCodeReason === 'OAUTH_INVALID_TOKEN' ||
      this.errorCodeReason === 'OAUTH_USER_REVOKED'
    )
  }
}

export class PlaidWebhookVerificationError extends ZunoError {
  constructor(message: string, cause?: unknown) {
    super(message, {
      cause,
      operation: 'webhooks.verify',
      provider: 'plaid',
    })
  }
}
