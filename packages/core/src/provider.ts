// SPDX-License-Identifier: Apache-2.0

export type ProviderSupportLevel = 'community' | 'deprecated' | 'experimental' | 'official'
export type ProviderAuthenticationType = 'api-key' | 'custom' | 'oauth2'

export interface ProviderAuthenticationManifest {
  pkce?: boolean
  rotatesRefreshTokens?: boolean
  type: ProviderAuthenticationType
}

export interface ProviderManifest {
  auth: ProviderAuthenticationManifest
  capabilities: Readonly<Record<string, readonly string[]>>
  category: string
  displayName: string
  environments: readonly string[]
  id: string
  support: ProviderSupportLevel
}

export function defineProviderManifest<const Manifest extends ProviderManifest>(
  manifest: Manifest,
): Manifest {
  return manifest
}
