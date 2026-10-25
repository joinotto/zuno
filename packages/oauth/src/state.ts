// SPDX-License-Identifier: Apache-2.0

import { ValidationError } from '@zuno/core'

const defaultStateBytes = 32

export function generateOAuthState(bytes = defaultStateBytes): string {
  if (!Number.isSafeInteger(bytes) || bytes < 16) {
    throw new ValidationError('OAuth state requires at least 16 bytes.', {
      operation: 'oauth.generateState',
      provider: 'oauth',
    })
  }

  const value = new Uint8Array(bytes)
  globalThis.crypto.getRandomValues(value)
  return encodeBase64Url(value)
}

export function verifyOAuthState(expected: string, received: string): boolean {
  const expectedBytes = new TextEncoder().encode(expected)
  const receivedBytes = new TextEncoder().encode(received)

  if (expectedBytes.length !== receivedBytes.length) {
    return false
  }

  let difference = 0

  for (let index = 0; index < expectedBytes.length; index += 1) {
    difference |= (expectedBytes[index] ?? 0) ^ (receivedBytes[index] ?? 0)
  }

  return difference === 0
}

export function encodeBase64Url(value: Uint8Array): string {
  let binary = ''

  for (const byte of value) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}
