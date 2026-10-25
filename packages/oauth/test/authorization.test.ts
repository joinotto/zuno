// SPDX-License-Identifier: Apache-2.0

import { ValidationError } from '@zuno/core'
import { describe, expect, it } from 'vitest'
import { createAuthorizationUrl } from '../src/index.js'

describe('createAuthorizationUrl', () => {
  it('creates an OAuth authorization URL', () => {
    const url = createAuthorizationUrl({
      authorizationUrl: 'https://provider.test/oauth',
      clientId: 'client',
      extraParameters: { audience: 'api' },
      redirectUri: 'https://app.test/callback',
      scopes: ['read', 'write'],
      state: 'state',
    })

    expect(url.searchParams.get('client_id')).toBe('client')
    expect(url.searchParams.get('redirect_uri')).toBe('https://app.test/callback')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('scope')).toBe('read write')
    expect(url.searchParams.get('state')).toBe('state')
    expect(url.searchParams.get('audience')).toBe('api')
  })

  it('rejects empty required values', () => {
    expect(() =>
      createAuthorizationUrl({
        authorizationUrl: 'https://provider.test/oauth',
        clientId: '',
        redirectUri: 'https://app.test/callback',
        scopes: [],
        state: 'state',
      }),
    ).toThrow(ValidationError)
  })
})
