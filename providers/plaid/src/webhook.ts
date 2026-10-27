// SPDX-License-Identifier: Apache-2.0

import { createHash, timingSafeEqual } from 'node:crypto'
import { decodeProtectedHeader, importJWK, jwtVerify } from 'jose'
import { PlaidWebhookVerificationError } from './errors.js'
import type {
  PlaidWebhook,
  PlaidWebhookVerificationKey,
  WebhookVerificationKeyGetResponse,
} from './types.js'

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
  return (
    'key' in value &&
    typeof value.key === 'object' &&
    value.key !== null &&
    'kid' in value.key
  )
}
