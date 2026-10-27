// SPDX-License-Identifier: Apache-2.0

import { createHash, timingSafeEqual } from 'node:crypto'
import { decodeProtectedHeader, importJWK, jwtVerify } from 'jose'
import { PlaidWebhookVerificationError } from './errors.js'
import type { PlaidWebhookVerificationKey, WebhookVerificationKeyGetResponse } from './types.js'
import type {
  PlaidAssetsWebhook,
  PlaidInvestmentsWebhook,
  PlaidItemWebhook,
  PlaidKnownWebhook,
  PlaidStatementsWebhook,
  PlaidTransactionsWebhook,
  PlaidWebhook,
} from './types/webhooks.js'

const assetsWebhookCodes = new Set(['ERROR', 'PRODUCT_READY'])
const investmentsWebhookCodes = new Set(['DEFAULT_UPDATE', 'HOLDINGS_UPDATE'])
const itemWebhookCodes = new Set([
  'ERROR',
  'NEW_ACCOUNTS_AVAILABLE',
  'PENDING_EXPIRATION',
  'USER_PERMISSION_REVOKED',
  'WEBHOOK_UPDATE_ACKNOWLEDGED',
])
const statementsWebhookCodes = new Set(['STATEMENTS_REFRESH_COMPLETE'])
const transactionsWebhookCodes = new Set([
  'DEFAULT_UPDATE',
  'HISTORICAL_UPDATE',
  'INITIAL_UPDATE',
  'RECURRING_TRANSACTIONS_UPDATE',
  'SYNC_UPDATES_AVAILABLE',
  'TRANSACTIONS_REMOVED',
])

export interface VerifyPlaidWebhookOptions {
  getVerificationKey: (
    keyId: string,
  ) => Promise<PlaidWebhookVerificationKey | WebhookVerificationKeyGetResponse>
  maxTokenAgeSeconds?: number
  now?: Date
}

export async function verifyPlaidWebhook(
  body: string | Uint8Array,
  signedJwt: string,
  options: VerifyPlaidWebhookOptions,
): Promise<PlaidWebhook> {
  if (signedJwt === '') {
    throw new PlaidWebhookVerificationError('The Plaid-Verification header is missing.')
  }

  try {
    const header = decodeProtectedHeader(signedJwt)
    if (header.alg !== 'ES256' || typeof header.kid !== 'string' || header.kid === '') {
      throw new PlaidWebhookVerificationError('The Plaid webhook signature header is invalid.')
    }

    const keyResponse = await options.getVerificationKey(header.kid)
    const key = isVerificationKeyResponse(keyResponse) ? keyResponse.key : keyResponse
    const now = options.now ?? new Date()
    if (key.expired_at !== null && key.expired_at <= Math.floor(now.getTime() / 1_000)) {
      throw new PlaidWebhookVerificationError('The Plaid webhook verification key has expired.')
    }

    const verificationKey = await importJWK(key, 'ES256')
    const verification = await jwtVerify(signedJwt, verificationKey, {
      algorithms: ['ES256'],
      currentDate: now,
      maxTokenAge: options.maxTokenAgeSeconds ?? 300,
    })
    const expectedHash = verification.payload.request_body_sha256
    if (typeof expectedHash !== 'string' || expectedHash === '') {
      throw new PlaidWebhookVerificationError(
        'The Plaid webhook signature does not contain a body hash.',
      )
    }

    const rawBody = typeof body === 'string' ? body : Buffer.from(body).toString('utf8')
    const actualHash = createHash('sha256').update(rawBody).digest('hex')
    if (!safeEqual(actualHash, expectedHash)) {
      throw new PlaidWebhookVerificationError(
        'The Plaid webhook body hash does not match the signature.',
      )
    }

    return parsePlaidWebhook(rawBody)
  } catch (error) {
    if (error instanceof PlaidWebhookVerificationError) {
      throw error
    }
    throw new PlaidWebhookVerificationError('The Plaid webhook signature is invalid.', error)
  }
}

function parsePlaidWebhook(body: string): PlaidWebhook {
  const payload: unknown = JSON.parse(body)
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('webhook_type' in payload) ||
    typeof payload.webhook_type !== 'string' ||
    !('webhook_code' in payload) ||
    typeof payload.webhook_code !== 'string'
  ) {
    throw new PlaidWebhookVerificationError('The Plaid webhook body is invalid.')
  }
  return payload as PlaidWebhook
}

export function isKnownPlaidWebhook(webhook: PlaidWebhook): webhook is PlaidKnownWebhook {
  return (
    isPlaidAssetsWebhook(webhook) ||
    isPlaidInvestmentsWebhook(webhook) ||
    isPlaidItemWebhook(webhook) ||
    isPlaidStatementsWebhook(webhook) ||
    isPlaidTransactionsWebhook(webhook)
  )
}

export function isPlaidAssetsWebhook(webhook: PlaidWebhook): webhook is PlaidAssetsWebhook {
  return webhook.webhook_type === 'ASSETS' && assetsWebhookCodes.has(webhook.webhook_code)
}

export function isPlaidInvestmentsWebhook(
  webhook: PlaidWebhook,
): webhook is PlaidInvestmentsWebhook {
  return (
    webhook.webhook_type === 'INVESTMENTS_TRANSACTIONS' &&
    investmentsWebhookCodes.has(webhook.webhook_code)
  )
}

export function isPlaidItemWebhook(webhook: PlaidWebhook): webhook is PlaidItemWebhook {
  return webhook.webhook_type === 'ITEM' && itemWebhookCodes.has(webhook.webhook_code)
}

export function isPlaidStatementsWebhook(webhook: PlaidWebhook): webhook is PlaidStatementsWebhook {
  return webhook.webhook_type === 'STATEMENTS' && statementsWebhookCodes.has(webhook.webhook_code)
}

export function isPlaidTransactionsWebhook(
  webhook: PlaidWebhook,
): webhook is PlaidTransactionsWebhook {
  return (
    webhook.webhook_type === 'TRANSACTIONS' && transactionsWebhookCodes.has(webhook.webhook_code)
  )
}

function safeEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  return (
    actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
  )
}

function isVerificationKeyResponse(
  value: PlaidWebhookVerificationKey | WebhookVerificationKeyGetResponse,
): value is WebhookVerificationKeyGetResponse {
  return 'key' in value && typeof value.key === 'object' && value.key !== null && 'kid' in value.key
}
