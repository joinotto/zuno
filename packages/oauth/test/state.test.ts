// SPDX-License-Identifier: Apache-2.0

import { ValidationError } from '@ottoai/zuno'
import { describe, expect, it } from 'vitest'
import { createPkcePair, generateOAuthState, verifyOAuthState } from '../src/index.js'

describe('OAuth state', () => {
  it('generates a base64url value', () => {
    expect(generateOAuthState()).toMatch(/^[A-Za-z0-9_-]+$/u)
  })

  it('requires sufficient entropy', () => {
    expect(() => generateOAuthState(8)).toThrow(ValidationError)
  })

  it('compares state values', () => {
    expect(verifyOAuthState('same', 'same')).toBe(true)
    expect(verifyOAuthState('same', 'diff')).toBe(false)
    expect(verifyOAuthState('short', 'longer')).toBe(false)
  })

  it('creates an S256 PKCE pair', async () => {
    const pair = await createPkcePair()

    expect(pair.challengeMethod).toBe('S256')
    expect(pair.verifier).toMatch(/^[A-Za-z0-9_-]+$/u)
    expect(pair.challenge).toMatch(/^[A-Za-z0-9_-]+$/u)
  })
})
