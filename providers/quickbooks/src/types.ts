// SPDX-License-Identifier: Apache-2.0

import type { RetryPolicy, TransportHooks } from '@ottoai/zuno'
import type { TokenSet } from '@ottoai/zuno-oauth'

export type QuickBooksEnvironment = 'production' | 'sandbox'

export interface QuickBooksOAuthConfig {
  clientId: string
  clientSecret: string
  fetch?: typeof globalThis.fetch
  redirectUri: string
  timeoutMs?: number
}

export interface QuickBooksClientOptions {
  environment: QuickBooksEnvironment
  fetch?: typeof globalThis.fetch
  getAccessToken: (forceRefresh?: boolean) => Promise<string>
  hooks?: TransportHooks
  minorVersion?: string
  realmId: string
  retry?: Partial<RetryPolicy>
  timeoutMs?: number
}

export interface QuickBooksTokenSet extends TokenSet {
  accessToken: string
  refreshToken: string
}

export interface QuickBooksCompanyInfo {
  id: string
  name?: string
  raw: QuickBooksRecord
}

export type QuickBooksRecord = Record<string, unknown>
