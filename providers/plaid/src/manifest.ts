// SPDX-License-Identifier: Apache-2.0

import { defineProviderManifest } from '@ottoai/zuno'

export const plaidManifest = defineProviderManifest({
  auth: {
    type: 'custom',
  },
  capabilities: {
    accounts: ['list', 'balances'],
    identity: ['get'],
    institutions: ['get', 'search'],
    items: ['exchange', 'get', 'remove', 'rotateToken', 'updateWebhook'],
    liabilities: ['get'],
    link: ['createToken', 'getToken'],
    transactions: ['sync', 'refresh'],
    webhooks: ['getVerificationKey', 'verify'],
  },
  category: 'banking',
  displayName: 'Plaid',
  environments: ['sandbox', 'development', 'production'],
  id: 'plaid',
  support: 'community',
} as const)

export type PlaidManifest = typeof plaidManifest
