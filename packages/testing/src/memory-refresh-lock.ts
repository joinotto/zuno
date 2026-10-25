// SPDX-License-Identifier: Apache-2.0

import type { RefreshLock } from '@ottoai/zuno-oauth'

export class MemoryRefreshLock implements RefreshLock {
  readonly #queues = new Map<string, Promise<void>>()

  async run<T>(connectionKey: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.#queues.get(connectionKey) ?? Promise.resolve()
    let release = (): void => undefined
    const current = new Promise<void>((resolve) => {
      release = resolve
    })
    const queue = previous.then(() => current)
    this.#queues.set(connectionKey, queue)

    await previous

    try {
      return await operation()
    } finally {
      release()

      if (this.#queues.get(connectionKey) === queue) {
        this.#queues.delete(connectionKey)
      }
    }
  }
}
