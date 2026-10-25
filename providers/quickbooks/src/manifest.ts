// SPDX-License-Identifier: Apache-2.0

export const quickBooksManifest = {
  auth: {
    pkce: false,
    rotatesRefreshTokens: true,
    type: 'oauth2',
  },
  capabilities: {
    accounts: ['list', 'get'],
    company: ['get'],
    reports: ['profitAndLoss', 'balanceSheet', 'cashFlow', 'trialBalance'],
    transactions: ['list', 'get', 'deleted'],
    webhooks: ['verify', 'parse'],
  },
  category: 'accounting',
  displayName: 'QuickBooks Online',
  environments: ['sandbox', 'production'],
  id: 'quickbooks',
  support: 'experimental',
} as const

export type QuickBooksManifest = typeof quickBooksManifest
