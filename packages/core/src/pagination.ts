// SPDX-License-Identifier: Apache-2.0

export interface Page<TItem, TCursor = string> {
  items: readonly TItem[]
  nextCursor?: TCursor
}

export type PageLoader<TItem, TCursor> = (
  cursor: TCursor | undefined,
) => Promise<Page<TItem, TCursor>>

export async function* iteratePages<TItem, TCursor = string>(
  loadPage: PageLoader<TItem, TCursor>,
): AsyncGenerator<Page<TItem, TCursor>> {
  let cursor: TCursor | undefined

  do {
    const page = await loadPage(cursor)
    yield page
    cursor = page.nextCursor
  } while (cursor !== undefined)
}

export async function* iterateItems<TItem, TCursor = string>(
  loadPage: PageLoader<TItem, TCursor>,
): AsyncGenerator<TItem> {
  for await (const page of iteratePages(loadPage)) {
    yield* page.items
  }
}
