// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest'
import { MemoryRefreshLock, MemoryTokenProvider } from '../src/index.js'

describe('MemoryTokenProvider', () => {
  it('stores copies of token data', async () => {
    const provider = new MemoryTokenProvider()
    const tokens = {
      accessToken: 'access',
      accessTokenExpiresAt: new Date('2026-01-01T00:00:00.000Z'),
      refreshToken: 'refresh',
      refreshTokenExpiresAt: new Date('2026-06-01T00:00:00.000Z'),
      scopes: ['read'],
    }

    await provider.set(tokens)
    const stored = await provider.get()
    tokens.scopes.push('write')

    expect(stored).toEqual({
      accessToken: 'access',
      accessTokenExpiresAt: new Date('2026-01-01T00:00:00.000Z'),
      refreshToken: 'refresh',
      refreshTokenExpiresAt: new Date('2026-06-01T00:00:00.000Z'),
      scopes: ['read'],
    })

    await provider.clear()
    await expect(provider.get()).resolves.toBeNull()
  })
})

describe('MemoryRefreshLock', () => {
  it('serializes operations for one connection', async () => {
    const lock = new MemoryRefreshLock()
    const order: string[] = []
    let releaseFirst = (): void => undefined
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve
    })

    const first = lock.run('connection', async () => {
      order.push('first:start')
      await firstGate
      order.push('first:end')
    })
    const second = lock.run('connection', async () => {
      order.push('second')
    })

    await Promise.resolve()
    expect(order).toEqual(['first:start'])
    releaseFirst()
    await Promise.all([first, second])
    expect(order).toEqual(['first:start', 'first:end', 'second'])
  })
})
