// SPDX-License-Identifier: Apache-2.0

import { AuthenticationError, ProviderApiError } from '@ottoai/zuno'
import type { QuickBooksOAuthConfig, QuickBooksRecord, QuickBooksTokenSet } from './types.js'

const authorizeUrl = 'https://appcenter.intuit.com/connect/oauth2'
const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
const revokeUrl = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke'
const defaultScope = 'com.intuit.quickbooks.accounting'

export class QuickBooksOAuth {
  readonly #config: QuickBooksOAuthConfig
  readonly #fetch: typeof globalThis.fetch

  constructor(config: QuickBooksOAuthConfig) {
    this.#config = config
    this.#fetch = config.fetch ?? globalThis.fetch
  }

  getAuthorizationUrl(state: string, scopes: readonly string[] = [defaultScope]): string {
    const parameters = new URLSearchParams({
      client_id: this.#config.clientId,
      redirect_uri: this.#config.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
    })

    return `${authorizeUrl}?${parameters.toString()}`
  }

  exchangeCode(code: string): Promise<QuickBooksTokenSet> {
    return this.#requestToken(
      new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.#config.redirectUri,
      }),
      'oauth.exchangeCode',
    )
  }

  refresh(refreshToken: string): Promise<QuickBooksTokenSet> {
    return this.#requestToken(
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      'oauth.refresh',
    )
  }

  async revoke(token: string): Promise<void> {
    const response = await this.#fetch(revokeUrl, {
      body: JSON.stringify({ token }),
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${this.#credentials()}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: AbortSignal.timeout(this.#config.timeoutMs ?? 30_000),
    })

    if (!response.ok) {
      throw new ProviderApiError('QuickBooks token revocation failed.', {
        body: await parseBody(response),
        operation: 'oauth.revoke',
        provider: 'quickbooks',
        status: response.status,
      })
    }
  }

  async #requestToken(body: URLSearchParams, operation: string): Promise<QuickBooksTokenSet> {
    const response = await this.#fetch(tokenUrl, {
      body,
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${this.#credentials()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
      signal: AbortSignal.timeout(this.#config.timeoutMs ?? 30_000),
    })
    const payload = await parseBody(response)

    if (!response.ok) {
      throw new AuthenticationError(
        String(payload.error_description ?? payload.error ?? 'QuickBooks OAuth request failed.'),
        {
          body: payload,
          operation,
          provider: 'quickbooks',
          status: response.status,
        },
      )
    }

    const accessToken = stringValue(payload.access_token)
    const refreshToken = stringValue(payload.refresh_token)

    if (accessToken === '' || refreshToken === '') {
      throw new AuthenticationError('QuickBooks returned an incomplete token response.', {
        body: payload,
        operation,
        provider: 'quickbooks',
        status: 502,
      })
    }

    const now = Date.now()
    const accessTokenLifetime = numberValue(payload.expires_in) ?? 3_600
    const refreshTokenLifetime = numberValue(payload.x_refresh_token_expires_in)

    return {
      accessToken,
      accessTokenExpiresAt: new Date(now + accessTokenLifetime * 1_000),
      refreshToken,
      refreshTokenExpiresAt:
        refreshTokenLifetime === undefined
          ? undefined
          : new Date(now + refreshTokenLifetime * 1_000),
      scopes: stringValue(payload.scope)
        .split(' ')
        .filter((scope) => scope !== ''),
    }
  }

  #credentials(): string {
    return Buffer.from(`${this.#config.clientId}:${this.#config.clientSecret}`).toString('base64')
  }
}

async function parseBody(response: Response): Promise<QuickBooksRecord> {
  const text = await response.text()

  if (text === '') {
    return {}
  }

  try {
    return JSON.parse(text) as QuickBooksRecord
  } catch {
    return { message: text }
  }
}

function stringValue(value: unknown): string {
  return value === undefined || value === null ? '' : String(value)
}

function numberValue(value: unknown): number | undefined {
  const result = Number(value)
  return Number.isFinite(result) ? result : undefined
}
