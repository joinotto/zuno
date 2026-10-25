// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest'
import {
  createTokenManager,
  isExpiring,
  TokenRefreshError,
  TokenUnavailableError,
} from '../src/index.js'
import type { RefreshLock, TokenProvider, TokenSet } from '../src/index.js'

class TestTokenProvider implements TokenProvider {
  tokens: TokenSet | null

  constructor(tokens: TokenSet | null) {
    this.tokens = tokens
  }

  async clear(): Promise<void> {
    this.tokens = null
  }

  async get(): Promise<TokenSet | null> {
    return this.tokens
  }

  async set(tokens: TokenSet): Promise<void> {
    this.tokens = tokens
  }
}

class TestRefreshLock implements RefreshLock {
  #current = Promise.resolve()

  async run<T>(_connectionKey: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.#current
    let release = (): void => undefined
    this.#current = new Promise<void>((resolve) => {
      release = resolve
    })

    await previous

    try {
      return await operation()
    } finally {
      release()
    }
  }
}

function createOptions(tokens: TokenSet | null) {
  const tokenProvider = new TestTokenProvider(tokens)
  const refresh = vi.fn(async () => ({
    accessToken: 'new-access',
    accessTokenExpiresAt: new Date('2026-01-01T02:00:00.000Z'),
  }))

  return {
    options: {
      connectionKey: 'connection-1',
      now: () => new Date('2026-01-01T00:00:00.000Z'),
      provider: 'test',
      refresh,
      refreshLock: new TestRefreshLock(),
      tokenProvider,
    },
    refresh,
    tokenProvider,
  }
}

describe('TokenManager', () => {
  it('returns a token that is not expiring', async () => {
    const setup = createOptions({
      accessToken: 'current',
      accessTokenExpiresAt: new Date('2026-01-01T01:00:00.000Z'),
      refreshToken: 'refresh',
    })
    const manager = createTokenManager(setup.options)

    await expect(manager.getAccessToken()).resolves.toBe('current')
    expect(setup.refresh).not.toHaveBeenCalled()
  })

  it('refreshes an expiring token and preserves omitted values', async () => {
    const setup = createOptions({
      accessToken: 'current',
      accessTokenExpiresAt: new Date('2026-01-01T00:00:30.000Z'),
      refreshToken: 'refresh',
      refreshTokenExpiresAt: new Date('2026-06-01T00:00:00.000Z'),
      scopes: ['read'],
    })
    const manager = createTokenManager(setup.options)

    await expect(manager.getTokens()).resolves.toEqual({
      accessToken: 'new-access',
      accessTokenExpiresAt: new Date('2026-01-01T02:00:00.000Z'),
      refreshToken: 'refresh',
      refreshTokenExpiresAt: new Date('2026-06-01T00:00:00.000Z'),
      scopes: ['read'],
    })
    expect(setup.tokenProvider.tokens?.accessToken).toBe('new-access')
  })

  it('performs one refresh for concurrent callers', async () => {
    const setup = createOptions({
      accessToken: 'current',
      accessTokenExpiresAt: new Date('2025-12-31T23:59:00.000Z'),
      refreshToken: 'refresh',
    })
    const manager = createTokenManager(setup.options)

    const results = await Promise.all([manager.getAccessToken(), manager.getAccessToken()])

    expect(results).toEqual(['new-access', 'new-access'])
    expect(setup.refresh).toHaveBeenCalledOnce()
  })

  it('does not refresh when another caller replaced the stale token', async () => {
    const setup = createOptions({
      accessToken: 'new-access',
      refreshToken: 'refresh',
    })
    const manager = createTokenManager(setup.options)

    await expect(manager.refresh('old-access')).resolves.toMatchObject({
      accessToken: 'new-access',
    })
    expect(setup.refresh).not.toHaveBeenCalled()
  })

  it('rejects missing access and refresh tokens', async () => {
    const missingAccess = createOptions(null)
    const missingRefresh = createOptions({
      accessToken: 'current',
      accessTokenExpiresAt: new Date('2025-12-31T23:59:00.000Z'),
    })

    await expect(createTokenManager(missingAccess.options).getTokens()).rejects.toBeInstanceOf(
      TokenUnavailableError,
    )
    await expect(createTokenManager(missingRefresh.options).getTokens()).rejects.toBeInstanceOf(
      TokenUnavailableError,
    )
  })

  it('wraps unexpected refresh failures', async () => {
    const setup = createOptions({
      accessToken: 'current',
      accessTokenExpiresAt: new Date('2025-12-31T23:59:00.000Z'),
      refreshToken: 'refresh',
    })
    setup.refresh.mockRejectedValueOnce(new Error('offline'))

    await expect(createTokenManager(setup.options).getTokens()).rejects.toBeInstanceOf(
      TokenRefreshError,
    )
  })
})

describe('isExpiring', () => {
  it('supports missing expiries and negative skew values', () => {
    const now = new Date('2026-01-01T00:00:00.000Z')

    expect(isExpiring({ accessToken: 'token' }, now)).toBe(false)
    expect(
      isExpiring(
        {
          accessToken: 'token',
          accessTokenExpiresAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        now,
        -1,
      ),
    ).toBe(true)
  })
})
