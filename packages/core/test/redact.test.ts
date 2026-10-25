// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest'
import { redact } from '../src/index.js'

describe('redact', () => {
  it('redacts nested sensitive values', () => {
    expect(
      redact({
        accessToken: 'secret',
        nested: {
          apiKey: 'key',
          value: 'visible',
        },
      }),
    ).toEqual({
      accessToken: '[REDACTED]',
      nested: {
        apiKey: '[REDACTED]',
        value: 'visible',
      },
    })
  })

  it('handles circular values', () => {
    const value: { self?: unknown } = {}
    value.self = value

    expect(redact(value)).toEqual({ self: '[Circular]' })
  })

  it('preserves primitive and array values', () => {
    expect(redact('visible')).toBe('visible')
    expect(redact([{ password: 'secret' }, null])).toEqual([{ password: '[REDACTED]' }, null])
  })
})
