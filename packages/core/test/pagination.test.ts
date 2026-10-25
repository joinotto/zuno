// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest'
import { iterateItems, iteratePages } from '../src/index.js'

describe('pagination', () => {
  it('iterates pages and items', async () => {
    const firstPage = { items: [1, 2], nextCursor: 'next' }
    const secondPage = { items: [3] }
    const pages = [firstPage, secondPage]
    const loadPage = async (cursor: string | undefined) =>
      cursor === undefined ? firstPage : secondPage

    const receivedPages = []
    for await (const page of iteratePages(loadPage)) {
      receivedPages.push(page)
    }

    const receivedItems = []
    for await (const item of iterateItems(loadPage)) {
      receivedItems.push(item)
    }

    expect(receivedPages).toEqual(pages)
    expect(receivedItems).toEqual([1, 2, 3])
  })
})
