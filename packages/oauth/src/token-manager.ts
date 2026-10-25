// SPDX-License-Identifier: Apache-2.0

import { ZunoError } from '@ottoai/zuno'
import type { RefreshLock, TokenProvider, TokenSet } from './tokens.js'

const defaultExpirySkewMs = 60_000

export interface RefreshableTokenSet extends TokenSet {
  refreshToken: string
}

export interface TokenManagerOptions {
  connectionKey: string
  expirySkewMs?: number
  now?: () => Date
  provider: string
  refresh: (tokens: RefreshableTokenSet) => Promise<TokenSet>
  refreshLock: RefreshLock
  tokenProvider: TokenProvider
}

export class TokenUnavailableError extends ZunoError {}
export class TokenRefreshError extends ZunoError {}

export class TokenManager {
  readonly #connectionKey: string
  readonly #expirySkewMs: number
  readonly #now: () => Date
  readonly #provider: string
  readonly #refresh: TokenManagerOptions['refresh']
  readonly #refreshLock: RefreshLock
  readonly #tokenProvider: TokenProvider

  constructor(options: TokenManagerOptions) {
    this.#connectionKey = options.connectionKey
    this.#expirySkewMs = options.expirySkewMs ?? defaultExpirySkewMs
    this.#now = options.now ?? (() => new Date())
    this.#provider = options.provider
    this.#refresh = options.refresh
    this.#refreshLock = options.refreshLock
    this.#tokenProvider = options.tokenProvider
  }

  async getAccessToken(): Promise<string> {
    return (await this.getTokens()).accessToken
  }

  async getTokens(): Promise<TokenSet> {
    const tokens = await this.#requireTokens()

    if (!isExpiring(tokens, this.#now(), this.#expirySkewMs)) {
      return tokens
    }

    return this.refresh(tokens.accessToken)
  }

  async refresh(staleAccessToken?: string): Promise<TokenSet> {
    return this.#refreshLock.run(this.#connectionKey, async () => {
      const current = await this.#requireTokens()

      if (staleAccessToken !== undefined && current.accessToken !== staleAccessToken) {
        return current
      }

      if (current.refreshToken === undefined || current.refreshToken === '') {
        throw new TokenUnavailableError('The refresh token is not available.', {
          operation: 'oauth.refresh',
          provider: this.#provider,
        })
      }

      try {
        const refreshed = await this.#refresh({
          ...current,
          refreshToken: current.refreshToken,
        })

        if (refreshed.accessToken === '') {
          throw new TokenRefreshError('The provider returned an empty access token.', {
            operation: 'oauth.refresh',
            provider: this.#provider,
          })
        }

        const next = mergeTokenSets(current, refreshed)
        await this.#tokenProvider.set(next)
        return next
      } catch (error) {
        if (error instanceof ZunoError) {
          throw error
        }

        throw new TokenRefreshError('The token refresh failed.', {
          cause: error,
          operation: 'oauth.refresh',
          provider: this.#provider,
        })
      }
    })
  }

  async #requireTokens(): Promise<TokenSet> {
    const tokens = await this.#tokenProvider.get()

    if (tokens === null || tokens.accessToken === '') {
      throw new TokenUnavailableError('The access token is not available.', {
        operation: 'oauth.getTokens',
        provider: this.#provider,
      })
    }

    return tokens
  }
}

export function createTokenManager(options: TokenManagerOptions): TokenManager {
  return new TokenManager(options)
}

export function isExpiring(tokens: TokenSet, now: Date, expirySkewMs = defaultExpirySkewMs): boolean {
  if (tokens.accessTokenExpiresAt === undefined) {
    return false
  }

  return tokens.accessTokenExpiresAt.getTime() <= now.getTime() + Math.max(0, expirySkewMs)
}

function mergeTokenSets(current: TokenSet, refreshed: TokenSet): TokenSet {
  return {
    accessToken: refreshed.accessToken,
    accessTokenExpiresAt: refreshed.accessTokenExpiresAt,
    refreshToken: refreshed.refreshToken ?? current.refreshToken,
    refreshTokenExpiresAt:
      refreshed.refreshTokenExpiresAt ?? current.refreshTokenExpiresAt,
    scopes: refreshed.scopes ?? current.scopes,
  }
}
