// SPDX-License-Identifier: Apache-2.0

export interface FetchCall {
  input: RequestInfo | URL
  init?: RequestInit | undefined
}

export type FetchQueueItem =
  Response | ((input: RequestInfo | URL, init?: RequestInit) => Promise<Response> | Response)

export interface FetchQueue {
  calls: FetchCall[]
  fetch: typeof globalThis.fetch
}

export function createFetchQueue(items: readonly FetchQueueItem[]): FetchQueue {
  const queue = [...items]
  const calls: FetchCall[] = []

  const fetchImplementation = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    calls.push({ input, init })
    const item = queue.shift()

    if (item === undefined) {
      throw new Error('The fetch queue is empty.')
    }

    return typeof item === 'function' ? item(input, init) : item
  }

  return {
    calls,
    fetch: fetchImplementation,
  }
}

export function createJsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set('content-type', 'application/json')

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  })
}
