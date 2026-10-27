// SPDX-License-Identifier: Apache-2.0

export interface PlaidBinaryResponse {
  contentHash?: string
  contentType?: string
  data: Uint8Array
  requestId?: string
}

export async function verifyPlaidContentHash(
  data: ArrayBuffer | Uint8Array,
  expectedHash: string,
): Promise<boolean> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', Uint8Array.from(toBytes(data)))
  const actual = toHex(new Uint8Array(digest))
  const expected = expectedHash.trim().toLowerCase()

  return actual.length === expected.length && constantTimeEqual(actual, expected)
}

function toBytes(data: ArrayBuffer | Uint8Array): Uint8Array {
  return data instanceof Uint8Array ? data : new Uint8Array(data)
}

function toHex(data: Uint8Array): string {
  return Array.from(data, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function constantTimeEqual(actual: string, expected: string): boolean {
  let difference = 0
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual.charCodeAt(index) ^ (expected.charCodeAt(index) || 0)
  }
  return difference === 0
}
