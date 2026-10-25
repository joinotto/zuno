// SPDX-License-Identifier: Apache-2.0

import { assertProviderManifestConforms } from '@ottoai/zuno-testing'
import { describe, expect, it } from 'vitest'
import { quickBooksManifest } from '../src/index.js'

describe('QuickBooks manifest', () => {
  it('declares a conforming experimental provider boundary', async () => {
    await expect(assertProviderManifestConforms(quickBooksManifest)).resolves.toBeUndefined()
    expect(quickBooksManifest).toMatchObject({
      category: 'accounting',
      id: 'quickbooks',
      support: 'experimental',
    })
  })
})
