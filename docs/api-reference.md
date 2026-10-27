# API Reference

## Status

This reference covers the stable `0.1` API. Semantic Versioning controls public API changes.

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

- `QuickBooksOAuth` creates authorization URLs and exchanges, refreshes, or revokes tokens.
- `QuickBooksClient` sends authenticated QuickBooks Online requests.
- `QuickBooksAccountingClient` supplies stable accounting operations and mappings.
- `QuickBooksClient.getCompanyInfo()` retrieves company information.
- `QuickBooksClient.request()` sends a provider-native request.
- `QuickBooksClient.companyPath()` creates a realm-scoped API path.
- `QuickBooksClient.withMinorVersion()` adds the configured QuickBooks minor version.
- `quickBooksManifest` describes implemented QuickBooks environments and capabilities.

## QuickBooks Accounting Compatibility

- `QuickBooksAccountingClient` is available from the package root.
- The `@ottoai/zuno-quickbooks/compatibility` entry point remains available.
- Account operations list and retrieve accounts.
- Contact operations list, retrieve, create, and update customers or suppliers.
- Category operations list and retrieve QuickBooks classes and departments.
- Transaction operations list, retrieve, and identify deleted transactions.
- Report operations return profit and loss, balance sheet, cash flow, and trial balance data.
- Grouped report operations summarize supported reports by month, quarter, year, or total.
- Mapping exports convert approved QuickBooks payloads into the compatibility model.
- `collectDeletedTransactionIds()` extracts deleted transaction IDs from CDC responses.

The accounting client is optional. Provider-native applications can use `QuickBooksClient` directly.

## `@ottoai/zuno-plaid`

- `PlaidClient` sends authenticated Plaid requests.
- `PlaidClient.createLinkToken()` creates a Link token.
- `PlaidClient.exchangePublicToken()` creates an Item access token.
- `PlaidClient.getItem()` retrieves Item state.
- `PlaidClient.getAccounts()` retrieves accounts.
- `PlaidClient.getBalances()` retrieves current account balances.
- `PlaidClient.getAuth()` retrieves account and routing numbers.
- `PlaidClient.getTransactions()` retrieves one date-range transaction page.
- `PlaidClient.getAllTransactions()` retrieves all date-range transaction pages.
- `PlaidClient.syncTransactions()` retrieves one Transactions Sync page.
- `PlaidClient.syncAllTransactions()` retrieves a complete cursor update.
- `PlaidClient.refreshTransactions()` requests a transaction refresh.
- `PlaidClient.getRecurringTransactions()` retrieves recurring inflow and outflow streams.
- `PlaidClient.enrichTransactions()` enriches supplied transaction descriptions.
- `PlaidClient.getIdentity()` retrieves identity data.
- `PlaidClient.getLiabilities()` retrieves liability data.
- `PlaidClient.getInvestmentHoldings()` retrieves holdings and securities.
- `PlaidClient.getInvestmentTransactions()` retrieves one investment transaction page.
- `PlaidClient.getAllInvestmentTransactions()` retrieves all investment transaction pages.
- `PlaidClient.refreshInvestments()` requests an investment refresh.
- `PlaidClient.listStatements()` lists available bank statements.
- `PlaidClient.downloadStatement()` downloads a statement.
- `PlaidClient.refreshStatements()` requests statement extraction.
- `PlaidClient.createAssetReport()` creates an Asset Report.
- `PlaidClient.getAssetReport()` retrieves Asset Report JSON.
- `PlaidClient.downloadAssetReportPdf()` downloads an Asset Report PDF.
- `PlaidClient.refreshAssetReport()` refreshes an Asset Report.
- `PlaidClient.filterAssetReport()` excludes accounts from an Asset Report.
- `PlaidClient.removeAssetReport()` removes an Asset Report.
- `PlaidClient.createAssetReportAuditCopy()` creates an auditor copy.
- `PlaidClient.removeAssetReportAuditCopy()` removes an auditor copy.
- `PlaidClient.createProcessorToken()` creates a processor token.
- `PlaidClient.createStripeBankAccountToken()` creates a Stripe bank account token.
- `PlaidClient.setProcessorTokenPermissions()` updates processor token products.
- `PlaidClient.getInstitutionById()` retrieves one institution.
- `PlaidClient.searchInstitutions()` searches institutions.
- `PlaidClient.verifyWebhook()` verifies and parses a signed webhook.
- `verifyPlaidContentHash()` verifies a downloaded Plaid file.
- Plaid webhook guards narrow supported event types and codes.
- `PlaidApiError` exposes Plaid error fields.
- `plaidManifest` describes implemented Plaid capabilities.
