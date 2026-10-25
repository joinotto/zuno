# Target Architecture

## Purpose

This document defines the package boundaries for Zuno.
It also defines the ownership of application data.

## Design Rules

- Keep provider business models inside provider packages.
- Keep shared infrastructure inside core packages.
- Keep application data and policy inside the application.
- Make hosted services optional.
- Make provider behavior observable.
- Preserve access to raw provider data.

## Architecture Layers

Zuno has four layers.

```text
Application
  ├─ owns users, tenants, databases, queues, and encryption
  ├─ implements token stores and refresh locks
  └─ maps provider data into application models

Application adapters
  ├─ Ledger adapter
  ├─ Unified compatibility adapter
  └─ other explicit application adapters

Provider packages
  ├─ QuickBooks
  ├─ Plaid
  ├─ Slack
  └─ Google Drive

Core packages
  ├─ HTTP transport
  ├─ OAuth contracts
  ├─ errors and request metadata
  ├─ pagination and retry control
  └─ hooks and test tools
```

Dependencies point from the application to the core.
Core packages do not import provider packages.
Provider packages do not import application adapters.

## Repository Layout

```text
packages/
  core/
  oauth/
  testing/
  store-memory/
  store-postgres/

providers/
  quickbooks/
  plaid/

adapters/
  compat-unified/
  ledger/

examples/
  node-api/
  cloudflare-worker/

docs/
legacy/
```

## Core Packages

### `@zuno/core`

This package supplies:

- HTTP transport
- request timeout
- request cancellation
- retry control
- typed errors
- request metadata
- pagination
- lifecycle hooks
- redacted logging contracts

### `@zuno/oauth`

This package supplies:

- authorization URL helpers
- callback exchange contracts
- token refresh contracts
- token revocation contracts
- OAuth state validation helpers
- PKCE helpers

### `@zuno/testing`

This package supplies:

- fixture recording
- fixture redaction
- fixture playback
- provider conformance tests
- webhook test helpers
- fake token stores
- fake refresh locks

## Token Contract

The application owns token persistence.

```ts
export interface TokenSet {
  accessToken: string
  refreshToken?: string
  accessTokenExpiresAt?: Date
  refreshTokenExpiresAt?: Date
  scopes?: string[]
}

export interface TokenProvider {
  get(): Promise<TokenSet | null>
  set(tokens: TokenSet): Promise<void>
  clear(): Promise<void>
}
```

Provider packages accept a `TokenProvider`.
Provider packages do not select an encryption method.

## Refresh Lock Contract

Some providers rotate refresh tokens.
Concurrent refresh operations can invalidate a new token.

```ts
export interface RefreshLock {
  run<T>(connectionKey: string, operation: () => Promise<T>): Promise<T>
}
```

Horizontally scaled applications must use a distributed lock.
The memory store is only for local development and tests.

## Request Metadata

```ts
export interface RequestMetadata {
  provider: string
  operation: string
  status: number
  requestId?: string
  attempts: number
  rateLimit?: {
    limit?: number
    remaining?: number
    resetAt?: Date
  }
}
```

Simple operations return provider data directly.
An optional response mode returns data and metadata.

```ts
const account = await quickbooks.accounts.get(accountId)

const result = await quickbooks.accounts.get(accountId, {
  response: 'full',
})

result.data
result.metadata
result.raw
```

## Provider Package Rules

1. Use provider-native names.
2. Preserve provider field meanings.
3. Preserve provider identifiers.
4. Expose a curated public API.
5. Keep generated clients internal.
6. Provide access to raw responses.
7. Preserve unknown enum values.
8. Validate public inputs.
9. Validate critical provider responses.
10. Make token refresh observable.
11. Retry only safe operations.
12. Require an idempotency key for unsafe retries.
13. Redact credentials and sensitive data.
14. Document unsupported operations.

## Provider Manifest

Each provider package exports a manifest.

```ts
export const manifest = {
  id: 'quickbooks',
  displayName: 'QuickBooks Online',
  category: 'accounting',
  environments: ['sandbox', 'production'],
  auth: {
    type: 'oauth2',
    pkce: false,
    rotatesRefreshTokens: true,
  },
  capabilities: {
    accounts: ['list', 'get'],
    reports: [
      'profitAndLoss',
      'balanceSheet',
      'cashFlow',
      'trialBalance',
    ],
    transactions: ['list', 'get', 'deleted'],
    webhooks: ['verify', 'parse'],
  },
} as const
```

The manifest supports documentation and discovery.
The manifest does not define a shared business model.

## Persistence

Provider packages accept persistence interfaces.
Provider packages do not import persistence implementations.

The application owns this data:

- tenant identifiers
- provider connection identifiers
- access tokens
- refresh tokens
- audit records
- synchronization cursors
- retention settings
- encryption keys

Optional store packages implement the public persistence interfaces.

## Error Model

The public error hierarchy contains these errors:

- `ZunoError`
- `ProviderApiError`
- `AuthenticationError`
- `AuthorizationError`
- `RateLimitError`
- `ValidationError`
- `TimeoutError`
- `ConnectionError`

Each error includes the provider and operation.
An API error includes the status and provider request identifier.
An error body must be redacted before exposure.

## Observability

Core packages emit lifecycle events.

- `request:start`
- `request:success`
- `request:error`
- `request:retry`
- `auth:refresh:start`
- `auth:refresh:success`
- `auth:refresh:error`
- `rate-limit`
- `webhook:received`

Zuno does not select a logging vendor.
An optional OpenTelemetry package can consume these events.

## Testing

### Unit Tests

Test these items:

- OAuth parameter generation
- retry delays
- token refresh races
- pagination
- report mapping
- webhook signatures
- error conversion
- redaction

### Fixture Tests

Test these payload conditions:

- empty data
- deleted data
- archived data
- malformed data
- unknown fields
- unknown enum values
- multiple currencies
- multiple locales
- multiple time zones
- pagination boundaries

### Sandbox Tests

Use provider sandbox accounts.
Use synthetic data only.
Delete records that a test creates.

### Consumer Tests

Ledger owns its application compatibility tests.
The tests compare the workspace code with the released package.

## Legacy Prototype

The first prototype combines several responsibilities.

It combines:

- hosted routes
- token persistence
- queue control
- normalized accounting schemas
- provider clients

Do not use these abstractions as the new SDK core.
Move useful code only after the provenance and compatibility reviews.
