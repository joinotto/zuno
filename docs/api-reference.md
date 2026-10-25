# API Reference

## Status

This reference covers the experimental Phase 1 API. A minor prerelease can contain breaking changes.

## `@ottoai/zuno`

### Transport

- `createTransport(options)` creates a Fetch-based provider transport.
- `Transport.request(request)` returns parsed data or a full response.
- `TransportHooks` defines request, response, retry, and error hooks.
- `RequestMetadata` contains status, attempts, request identifiers, and rate-limit data.

### Errors

- `ZunoError` is the base error.
- `ProviderApiError` contains provider status and response data.
- `AuthenticationError` represents status `401`.
- `AuthorizationError` represents status `403`.
- `RateLimitError` represents status `429`.
- `ConnectionError` represents a network failure.
- `TimeoutError` represents a request timeout.
- `ValidationError` represents invalid SDK input.

### Retry and Pagination

- `createRetryPolicy(policy)` completes a partial retry policy.
- `getRetryDelay(attempt, policy, retryAfter)` calculates a bounded delay.
- `parseRetryAfter(value)` parses seconds or an HTTP date.
- `iteratePages(loader)` returns an asynchronous page iterator.
- `iterateItems(loader)` returns an asynchronous item iterator.

### Provider Metadata

- `defineProviderManifest(manifest)` preserves literal manifest types.
- `ProviderManifest` defines category-neutral provider metadata.
- `ProviderSupportLevel` defines project support states.

### Redaction

- `redact(value)` copies structured data and removes common credential fields.

## `@ottoai/zuno-oauth`

### Authorization

- `createAuthorizationUrl(options)` creates an OAuth authorization URL.
- `generateOAuthState(bytes)` creates secure state data.
- `verifyOAuthState(expected, received)` compares state values.
- `createPkcePair()` creates an S256 PKCE verifier and challenge.

### Tokens

- `TokenProvider` defines application-owned token persistence.
- `RefreshLock` serializes refresh operations for one connection.
- `TokenSet` defines access tokens, refresh tokens, expiries, and scopes.
- `createTokenManager(options)` creates a coordinated token manager.
- `TokenManager.getTokens()` returns current or refreshed tokens.
- `TokenManager.getAccessToken()` returns a current access token.
- `TokenManager.refresh(staleAccessToken)` safely forces token refresh.
- `isExpiring(tokens, now, skew)` checks the access-token refresh window.

## `@ottoai/zuno-testing`

### Deterministic Fetch

- `createFetchQueue(items)` returns queued responses and recorded calls.
- `createJsonResponse(body, init)` creates a JSON response.
- `createRecordingFetch(options)` records sanitized HTTP exchanges.
- `createReplayFetch(recordings)` replays matching HTTP exchanges.

### OAuth Test Stores

- `MemoryTokenProvider` stores token copies in memory.
- `MemoryRefreshLock` serializes local refresh operations.

### Conformance

- `runConformanceSuite(subject, cases)` runs framework-neutral checks.
- `assertConformance(result)` throws when a suite fails.
- `checkProviderManifest(manifest)` validates standard provider metadata.
- `assertProviderManifestConforms(manifest)` validates or throws.
- `providerManifestConformance` contains the standard manifest cases.

## `@ottoai/zuno-quickbooks`

- `quickBooksManifest` describes QuickBooks environments and planned capabilities.

The QuickBooks client operations are not part of the Phase 1 API.
