// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest'
import { createFetchQueue, createJsonResponse } from '../src/index.js'

describe('fetch queue', () => {
  it('returns queued responses and records calls', async () => {
    const queue = createFetchQueue([createJsonResponse({ ok: true })])
    const response = await queue.fetch('https://example.test')

    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(queue.calls).toHaveLength(1)
  })

  it('fails after the queue is empty', async () => {
    const queue = createFetchQueue([])

    await expect(queue.fetch('https://example.test')).rejects.toThrow('The fetch queue is empty.')
  })

  it('runs a queued response function', async () => {
    const queue = createFetchQueue([
      (input) =>
        createJsonResponse({
          input: typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
        }),
    ])

    await expect(
      queue.fetch('https://example.test/function').then((response) => response.json()),
    ).resolves.toEqual({ input: 'https://example.test/function' })
  })
})
