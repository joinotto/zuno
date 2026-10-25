// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest'
import { createRetryPolicy, getRetryDelay, parseRetryAfter } from '../src/index.js'

describe('retry helpers', () => {
  it('parses retry seconds', () => {
    expect(parseRetryAfter('2')).toBe(2_000)
  })

  it('parses retry dates', () => {
    expect(parseRetryAfter('Thu, 01 Jan 2026 00:00:02 GMT', Date.UTC(2026, 0, 1))).toBe(2_000)
  })

  it('rejects invalid retry values', () => {
    expect(parseRetryAfter('invalid')).toBeUndefined()
    expect(parseRetryAfter(null)).toBeUndefined()
  })

  it('limits exponential delays', () => {
    const policy = createRetryPolicy({
      baseDelayMs: 1_000,
      maxDelayMs: 1_500,
    })

    expect(getRetryDelay(3, policy, null)).toBe(1_500)
    expect(getRetryDelay(1, policy, '20')).toBe(1_500)
  })
})
