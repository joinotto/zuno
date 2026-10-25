// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest'
import { quickBooksManifest } from '../src/index.js'

describe('QuickBooks manifest', () => {
  it('declares the experimental provider boundary', () => {
    expect(quickBooksManifest).toMatchObject({
      category: 'accounting',
      id: 'quickbooks',
      support: 'experimental',
    })
  })
})
