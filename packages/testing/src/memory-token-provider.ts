// SPDX-License-Identifier: Apache-2.0

import type { TokenProvider, TokenSet } from '@zuno/oauth'

export class MemoryTokenProvider implements TokenProvider {
  #tokens: TokenSet | null

  constructor(tokens: TokenSet | null = null) {
    this.#tokens = cloneTokens(tokens)
  }

  async clear(): Promise<void> {
    this.#tokens = null
  }

  async get(): Promise<TokenSet | null> {
    return cloneTokens(this.#tokens)
  }

  async set(tokens: TokenSet): Promise<void> {
    this.#tokens = cloneTokens(tokens)
  }
}

function cloneTokens(tokens: TokenSet | null): TokenSet | null {
  if (tokens === null) {
    return null
  }

  return {
    ...tokens,
    accessTokenExpiresAt:
      tokens.accessTokenExpiresAt === undefined ? undefined : new Date(tokens.accessTokenExpiresAt),
    refreshTokenExpiresAt:
      tokens.refreshTokenExpiresAt === undefined
        ? undefined
        : new Date(tokens.refreshTokenExpiresAt),
    scopes: tokens.scopes === undefined ? undefined : [...tokens.scopes],
  }
}
