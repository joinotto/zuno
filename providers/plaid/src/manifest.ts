// SPDX-License-Identifier: Apache-2.0

import { defineProviderManifest } from '@ottoai/zuno'

export const plaidManifest = defineProviderManifest({
  auth: {
    type: 'custom',
  },
  capabilities: {
    accounts: ['list', 'balances'],
    assets: [
      'createReport',
      'getReport',
      'downloadReportPdf',
      'refreshReport',
      'filterReport',
      'removeReport',
      'createAuditCopy',
      'removeAuditCopy',
    ],
    auth: ['get'],
    enrich: ['transactions'],
    identity: ['get'],
    institutions: ['get', 'search'],
    investments: ['getHoldings', 'getTransactions', 'refresh'],
    items: ['exchange', 'get', 'remove', 'rotateToken', 'updateWebhook'],
    liabilities: ['get'],
    link: ['createToken', 'getToken'],
    processors: ['createToken', 'createStripeBankAccountToken', 'setTokenPermissions'],
    statements: ['list', 'download', 'refresh'],
    transactions: ['get', 'sync', 'refresh', 'recurring'],
    webhooks: ['getVerificationKey', 'verify'],
  },
  category: 'banking',
  displayName: 'Plaid',
  environments: ['sandbox', 'development', 'production'],
  id: 'plaid',
  support: 'community',
} as const)

export type PlaidManifest = typeof plaidManifest
