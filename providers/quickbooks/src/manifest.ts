// SPDX-License-Identifier: Apache-2.0

import { defineProviderManifest } from '@ottoai/zuno'

export const quickBooksManifest = defineProviderManifest({
  auth: {
    pkce: false,
    rotatesRefreshTokens: true,
    type: 'oauth2',
  },
  capabilities: {
    accounts: ['list', 'get'],
    categories: ['list', 'get'],
    company: ['get'],
    contacts: ['list', 'get', 'create', 'update'],
    oauth: ['authorize', 'exchange', 'refresh', 'revoke'],
    reports: ['profitAndLoss', 'balanceSheet', 'cashFlow', 'trialBalance', 'group'],
    transactions: ['list', 'get', 'deleted'],
  },
  category: 'accounting',
  displayName: 'QuickBooks Online',
  environments: ['sandbox', 'production'],
  id: 'quickbooks',
  support: 'community',
} as const)

export type QuickBooksManifest = typeof quickBooksManifest
