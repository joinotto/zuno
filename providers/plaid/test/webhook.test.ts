// SPDX-License-Identifier: Apache-2.0

import { createHash, generateKeyPairSync } from 'node:crypto'
import { exportJWK, importPKCS8, SignJWT } from 'jose'
import { describe, expect, it } from 'vitest'
import { PlaidWebhookVerificationError, verifyPlaidWebhook } from '../src/index.js'

describe('verifyPlaidWebhook', () => {
  it('rejects a missing signature', async () => {
    await expect(
      verifyPlaidWebhook('{}', '', {
        getVerificationKey: async () => {
          throw new Error('must not request a key')
        },
      }),
    ).rejects.toThrow('Plaid-Verification header is missing')
  })

  it('rejects a signature with an unsupported algorithm', async () => {
    await expect(
      verifyPlaidWebhook('{}', 'eyJhbGciOiJIUzI1NiIsImtpZCI6ImtleS0xIn0.e30.signature', {
        getVerificationKey: async () => {
          throw new Error('must not request a key')
        },
      }),
    ).rejects.toThrow('signature header is invalid')
  })

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
    const privatePem = privateKey.export({ format: 'pem', type: 'pkcs8' })
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
          key: {
            ...publicJwk,
            alg: 'ES256',
            crv: 'P-256',
            expired_at: null,
            kid: 'key-1',
            kty: 'EC',
            use: 'sig',
            x: String(publicJwk.x),
            y: String(publicJwk.y),
          },
          request_id: 'request-1',
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
      privateKey.export({ format: 'pem', type: 'pkcs8' }),
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

  it('rejects an expired verification key', async () => {
    const now = new Date('2026-10-27T12:00:00Z')
    const { signedJwt, publicJwk } = await createSignedWebhook('{}', now)

    await expect(
      verifyPlaidWebhook('{}', signedJwt, {
        getVerificationKey: async () => ({
          ...publicJwk,
          alg: 'ES256',
          crv: 'P-256',
          expired_at: Math.floor(now.getTime() / 1_000) - 1,
          kid: 'key-1',
          kty: 'EC',
          use: 'sig',
          x: String(publicJwk.x),
          y: String(publicJwk.y),
        }),
        now,
      }),
    ).rejects.toThrow('verification key has expired')
  })

  it('rejects a verified payload without a body hash', async () => {
    const now = new Date('2026-10-27T12:00:00Z')
    const { privateKey, publicKey } = generateKeyPairSync('ec', {
      namedCurve: 'P-256',
    })
    const signingKey = await importPKCS8(
      privateKey.export({ format: 'pem', type: 'pkcs8' }),
      'ES256',
    )
    const publicJwk = await exportJWK(publicKey)
    const signedJwt = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: 'key-1' })
      .setIssuedAt(Math.floor(now.getTime() / 1_000))
      .sign(signingKey)

    await expect(
      verifyPlaidWebhook('{}', signedJwt, {
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
    ).rejects.toThrow('does not contain a body hash')
  })
})

async function createSignedWebhook(body: string, now: Date) {
  const { privateKey, publicKey } = generateKeyPairSync('ec', {
    namedCurve: 'P-256',
  })
  const signingKey = await importPKCS8(privateKey.export({ format: 'pem', type: 'pkcs8' }), 'ES256')
  const publicJwk = await exportJWK(publicKey)
  const signedJwt = await new SignJWT({
    request_body_sha256: createHash('sha256').update(body).digest('hex'),
  })
    .setProtectedHeader({ alg: 'ES256', kid: 'key-1' })
    .setIssuedAt(Math.floor(now.getTime() / 1_000))
    .sign(signingKey)
  return { publicJwk, signedJwt }
}
