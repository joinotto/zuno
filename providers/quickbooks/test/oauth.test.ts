// SPDX-License-Identifier: Apache-2.0

import { AuthenticationError, ProviderApiError } from '@ottoai/zuno'
import { describe, expect, it } from 'vitest'
import { QuickBooksOAuth } from '../src/oauth.js'

describe('QuickBooksOAuth', () => {
  it('creates the accounting authorization URL', () => {
    const oauth = new QuickBooksOAuth({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'https://example.test/callback',
    })
    const url = new URL(oauth.getAuthorizationUrl('state-value'))

    expect(url.origin + url.pathname).toBe('https://appcenter.intuit.com/connect/oauth2')
    expect(url.searchParams.get('client_id')).toBe('client-id')
    expect(url.searchParams.get('redirect_uri')).toBe('https://example.test/callback')
    expect(url.searchParams.get('scope')).toBe('com.intuit.quickbooks.accounting')
    expect(url.searchParams.get('state')).toBe('state-value')
    expect(oauth.getAuthorizationUrl('state-value', ['openid'])).toContain('scope=openid')
  })

  it('maps a token response', async () => {
    const oauth = new QuickBooksOAuth({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      fetch: async () =>
        Response.json({
          access_token: 'access-token',
          expires_in: 3_600,
          refresh_token: 'refresh-token',
          scope: 'com.intuit.quickbooks.accounting openid',
          x_refresh_token_expires_in: 8_640_000,
        }),
      redirectUri: 'https://example.test/callback',
    })

    await expect(oauth.exchangeCode('authorization-code')).resolves.toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      scopes: ['com.intuit.quickbooks.accounting', 'openid'],
    })
  })

  it('sends a refresh request with basic authentication', async () => {
    let request: Request | undefined
    const oauth = new QuickBooksOAuth({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      fetch: async (input, init) => {
        request = new Request(input, init)
        return Response.json({
          access_token: 'access-token',
          expires_in: 3_600,
          refresh_token: 'rotated-refresh-token',
        })
      },
      redirectUri: 'https://example.test/callback',
    })

    const tokens = await oauth.refresh('refresh-token')

    expect(request?.headers.get('authorization')).toBe(
      `Basic ${Buffer.from('client-id:client-secret').toString('base64')}`,
    )
    await expect(request?.text()).resolves.toContain('grant_type=refresh_token')
    expect(tokens.refreshToken).toBe('rotated-refresh-token')
    expect(tokens.refreshTokenExpiresAt).toBeUndefined()
    expect(tokens.scopes).toEqual([])
  })

  it('maps OAuth failures to authentication errors', async () => {
    const oauth = new QuickBooksOAuth({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      fetch: async () =>
        Response.json(
          {
            error: 'invalid_grant',
            error_description: 'The authorization code is invalid.',
          },
          { status: 400 },
        ),
      redirectUri: 'https://example.test/callback',
    })

    await expect(oauth.exchangeCode('invalid-code')).rejects.toBeInstanceOf(AuthenticationError)
  })

  it('rejects incomplete token responses', async () => {
    const oauth = new QuickBooksOAuth({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      fetch: async () => Response.json({ access_token: 'access-token' }),
      redirectUri: 'https://example.test/callback',
    })

    await expect(oauth.exchangeCode('authorization-code')).rejects.toBeInstanceOf(
      AuthenticationError,
    )
  })

  it('revokes tokens and maps revocation failures', async () => {
    const successful = new QuickBooksOAuth({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      fetch: async () => new Response(null, { status: 200 }),
      redirectUri: 'https://example.test/callback',
    })
    const failing = new QuickBooksOAuth({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      fetch: async () => new Response('unavailable', { status: 503 }),
      redirectUri: 'https://example.test/callback',
    })

    await expect(successful.revoke('refresh-token')).resolves.toBeUndefined()
    await expect(failing.revoke('refresh-token')).rejects.toBeInstanceOf(ProviderApiError)
  })
})
