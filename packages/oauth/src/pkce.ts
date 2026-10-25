// SPDX-License-Identifier: Apache-2.0

import { generateOAuthState, encodeBase64Url } from './state.js'

export interface PkcePair {
  challenge: string
  challengeMethod: 'S256'
  verifier: string
}

export async function createPkcePair(): Promise<PkcePair> {
  const verifier = generateOAuthState(64)
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  )

  return {
    challenge: encodeBase64Url(new Uint8Array(digest)),
    challengeMethod: 'S256',
    verifier,
  }
}
