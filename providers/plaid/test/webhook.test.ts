// SPDX-License-Identifier: Apache-2.0

import { createHash, generateKeyPairSync } from 'node:crypto'
import { exportJWK, importPKCS8, SignJWT } from 'jose'
import { describe, expect, it } from 'vitest'
import { PlaidWebhookVerificationError, verifyPlaidWebhook } from '../src/index.js'

describe('verifyPlaidWebhook', () => {
  it('verifies the ES256 signature and raw body hash', async () => {
    const now = new Date('2026-10-27T12:00:00Z')
    const body = JSON.stringify({
      item_id: 'item-1',
      webhook_code: 'SYNC_UPDATES_AVAILABLE',
      webhook_type: 'TRANSACTIONS',
    })
    const { privateKey, publicKey } = generateKeyPairSync('ec', {
      namedCurve: 'P-256',
    })
    const privatePem = privateKey.export({ format: 'pem', type: 'pkcs8' }).toString()
    const signingKey = await importPKCS8(privatePem, 'ES256')
    const publicJwk = await exportJWK(publicKey)
    const signedJwt = await new SignJWT({
      request_body_sha256: createHash('sha256').update(body).digest('hex'),
    })
      .setProtectedHeader({ alg: 'ES256', kid: 'key-1' })
      .setIssuedAt(Math.floor(now.getTime() / 1_000))
      .sign(signingKey)

    await expect(
      verifyPlaidWebhook(body, signedJwt, {
        getVerificationKey: async () => ({
          ...publicJwk,
          alg: 'ES256',
          crv: 'P-256',
          expired_at: null,
          kid: 'key-1',
          kty: 'EC',
          use: 'sig',
          x: String(publicJwk.x),
          y: String(publicJwk.y),
        }),
        now,
      }),
    ).resolves.toMatchObject({
      item_id: 'item-1',
      webhook_code: 'SYNC_UPDATES_AVAILABLE',
      webhook_type: 'TRANSACTIONS',
    })
  })

  it('rejects a modified body', async () => {
    const now = new Date('2026-10-27T12:00:00Z')
    const { privateKey, publicKey } = generateKeyPairSync('ec', {
      namedCurve: 'P-256',
    })
    const signingKey = await importPKCS8(
      privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(),
      'ES256',
    )
    const publicJwk = await exportJWK(publicKey)
    const signedJwt = await new SignJWT({
      request_body_sha256: createHash('sha256').update('{}').digest('hex'),
    })
      .setProtectedHeader({ alg: 'ES256', kid: 'key-1' })
      .setIssuedAt(Math.floor(now.getTime() / 1_000))
      .sign(signingKey)

    await expect(
      verifyPlaidWebhook('{"changed":true}', signedJwt, {
        getVerificationKey: async () => ({
          ...publicJwk,
          alg: 'ES256',
          crv: 'P-256',
          expired_at: null,
          kid: 'key-1',
          kty: 'EC',
          use: 'sig',
          x: String(publicJwk.x),
          y: String(publicJwk.y),
        }),
        now,
      }),
    ).rejects.toBeInstanceOf(PlaidWebhookVerificationError)
  })
})
