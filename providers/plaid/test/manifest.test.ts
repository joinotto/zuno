// SPDX-License-Identifier: Apache-2.0

import { assertProviderManifestConforms } from '@ottoai/zuno-testing'
import { describe, expect, it } from 'vitest'
import { plaidManifest } from '../src/index.js'

describe('Plaid manifest', () => {
  it('declares a conforming community banking provider', async () => {
    await expect(assertProviderManifestConforms(plaidManifest)).resolves.toBeUndefined()
    expect(plaidManifest).toMatchObject({
      category: 'banking',
      id: 'plaid',
      support: 'community',
    })
    expect(plaidManifest.capabilities.transactions).toContain('sync')
    expect(plaidManifest.capabilities.webhooks).toContain('verify')
  })
})
