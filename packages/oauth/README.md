# `@ottoai/zuno-oauth`

This package supplies OAuth 2.0 primitives for Zuno provider packages.

Applications own token persistence and encryption. The stable `0.1` API follows Semantic Versioning.

## Install

```bash
pnpm add @ottoai/zuno-oauth
```

## Create an Authorization URL

```ts
import { createAuthorizationUrl, generateOAuthState } from '@ottoai/zuno-oauth'

const state = generateOAuthState()
const url = createAuthorizationUrl({
  authorizationUrl: 'https://provider.example/oauth/authorize',
  clientId: process.env.PROVIDER_CLIENT_ID!,
  redirectUri: 'https://app.example/oauth/callback',
  scopes: ['records.read'],
  state,
})
```

Store the state in a secure server session. Verify it before the application exchanges the code.

## Manage Token Refresh

```ts
import { createTokenManager } from '@ottoai/zuno-oauth'

const tokens = createTokenManager({
  connectionKey: 'connection-123',
  provider: 'example',
  refresh: async (current) => refreshProviderTokens(current.refreshToken),
  refreshLock,
  tokenProvider,
})

const accessToken = await tokens.getAccessToken()
```

The manager reads tokens again inside the refresh lock. Concurrent workers therefore reuse a token
that another worker refreshed.

## Application Contracts

Implement `TokenProvider` with encrypted persistence. Implement `RefreshLock` with a distributed
lock when multiple processes can refresh one connection.
