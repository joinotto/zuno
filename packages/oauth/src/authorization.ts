// SPDX-License-Identifier: Apache-2.0

import { ValidationError } from '@ottoai/zuno'

export interface AuthorizationUrlOptions {
  authorizationUrl: string | URL
  clientId: string
  extraParameters?: Readonly<Record<string, string>>
  redirectUri: string
  responseType?: string
  scopes: readonly string[]
  state: string
}

export function createAuthorizationUrl(options: AuthorizationUrlOptions): URL {
  if (options.clientId === '' || options.redirectUri === '' || options.state === '') {
    throw new ValidationError('OAuth authorization values must not be empty.', {
      operation: 'oauth.createAuthorizationUrl',
      provider: 'oauth',
    })
  }

  const url = new URL(options.authorizationUrl)
  url.searchParams.set('client_id', options.clientId)
  url.searchParams.set('redirect_uri', options.redirectUri)
  url.searchParams.set('response_type', options.responseType ?? 'code')
  url.searchParams.set('scope', options.scopes.join(' '))
  url.searchParams.set('state', options.state)

  for (const [key, value] of Object.entries(options.extraParameters ?? {})) {
    url.searchParams.set(key, value)
  }

  return url
}
