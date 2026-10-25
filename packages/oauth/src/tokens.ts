// SPDX-License-Identifier: Apache-2.0

export interface TokenSet {
  accessToken: string
  accessTokenExpiresAt?: Date | undefined
  refreshToken?: string | undefined
  refreshTokenExpiresAt?: Date | undefined
  scopes?: readonly string[] | undefined
}

export interface TokenProvider {
  clear(): Promise<void>
  get(): Promise<TokenSet | null>
  set(tokens: TokenSet): Promise<void>
}

export interface RefreshLock {
  run<T>(connectionKey: string, operation: () => Promise<T>): Promise<T>
}
