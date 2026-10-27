# Plaid Provider

## Status

Active alpha development.

Package: `@ottoai/zuno-plaid`

## Purpose

The Plaid provider supplies provider-native banking operations. It validates the shared Zuno
packages outside accounting.

## Current Scope

- Link token creation
- Link token retrieval
- public token exchange
- Item retrieval, removal, webhook update, and token rotation
- institution retrieval and search
- accounts and balances
- Auth account-number retrieval
- Transactions Get, Sync, refresh, recurring streams, and enrichment
- statements and PDF downloads
- investment holdings, transactions, and refresh
- Asset Reports, filters, audit copies, and PDF downloads
- processor tokens and permission updates
- identity and liabilities
- signed webhook verification, parsing, and typed event guards
- Item errors and reauthorization

## Environment

The client supports:

- Plaid Sandbox
- Plaid Development
- Plaid Production

The default API version is `2020-09-14`.

## Link Flow

1. Create a Link token on the application server.
2. Send the Link token to the trusted application client.
3. Complete Plaid Link.
4. Send the public token to the application server.
5. Exchange the public token for an access token.
6. Encrypt and store the access token.
7. Store the returned Item identifier.

Do not expose the Plaid client secret or access token to a browser.

## Transactions Sync

Use `syncTransactions()` for one page. Use `syncAllTransactions()` for a complete update.

The complete helper:

- requests each page in order
- collects added records
- collects modified records
- collects removed identifiers
- returns the final cursor
- restarts after a pagination mutation

Persist the final cursor after the application stores every change.

## Statements

Use `listStatements()` to list available statements. Use `refreshStatements()` to request another
date range.

Use `downloadStatement()` to receive statement bytes and response metadata. When Plaid supplies a
content hash, use `verifyPlaidContentHash()` before storing the file.

The provider does not parse statement PDFs. A consuming application must own document storage,
retention, extraction, and bookkeeping workflows.

## Transactions and Recurring Streams

Use `getTransactions()` for one date-range page. Use `getAllTransactions()` to collect all pages.
Use Transactions Sync for ongoing synchronization.

Transaction types include provider fields for:

- original descriptions
- authorized and posted dates
- counterparties
- payment metadata
- locations
- pending-to-posted identifiers
- personal finance categories

Use `getRecurringTransactions()` to retrieve Plaid recurring inflow and outflow streams.

Use `enrichTransactions()` only for transaction data that the application is authorized to send to
Plaid.

## Auth

Use `getAuth()` to retrieve provider account and routing numbers.

Account numbers are sensitive. Do not log them. Encrypt stored values and limit access to the
smallest required application role.

## Investments

Use `getInvestmentHoldings()` for accounts, holdings, and securities.

Use `getInvestmentTransactions()` for one page. Use `getAllInvestmentTransactions()` to collect all
pages. Use `refreshInvestments()` when the application needs an on-demand refresh.

## Asset Reports

The client supports Asset Report creation, retrieval, refresh, filtering, removal, audit copies, and
PDF downloads.

Asset Reports can contain sensitive identity, account, balance, and transaction data. The consuming
application must apply access control, encryption, retention, and deletion policies.

## Processor Tokens

Use `createProcessorToken()` for an approved Plaid processor. Use `setProcessorTokenPermissions()`
to update permitted products.

Use `createStripeBankAccountToken()` only for the Plaid and Stripe processor flow.

The consuming application must control which tenants and accounts can create processor tokens.

## Item Update Mode

`PlaidApiError.requiresUpdateMode` identifies common Item errors that require Link update mode.

Applications must create a new Link token with the Item access token. Applications own the user
experience and connection status.

## Webhook Verification

Use `verifyWebhook()` with the exact raw request body and `Plaid-Verification` header.

The verifier:

1. reads the ES256 key identifier
2. retrieves the Plaid verification key
3. validates the JWT signature
4. rejects expired verification keys
5. limits the token age
6. validates the raw body hash
7. parses the verified webhook

Applications must deduplicate deliveries and store processing status.

Typed guards are available for supported Item, Transactions, Statements, Investments, and Assets
events. Unknown events remain valid `PlaidWebhook` values so applications can log and inspect new
Plaid event types safely.

## Error Model

`PlaidApiError` includes:

- HTTP status
- Plaid error type
- Plaid error code
- Plaid error reason
- Plaid request identifier
- update-mode detection

Provider response bodies pass through Zuno redaction before the Plaid error is created.

## Application Responsibilities

The application will own:

- users and tenants
- encrypted access-token storage
- synchronization cursors
- webhook delivery records
- retention and deletion policy
- provider consent and product configuration

## Delivery Conditions

## Release Conditions

The first stable release must:

1. Use provider-native Plaid types.
2. Keep banking models out of `@ottoai/zuno`.
3. Include sandbox fixtures and tests.
4. Test cursor restart and replay behavior.
5. Verify webhook signatures.
6. Document supported Plaid products.
7. Document API-version and environment requirements.
8. Complete Sandbox validation.
9. Add sanitized Sandbox recordings.

## Official References

- [Plaid API](https://plaid.com/docs/api/)
- [Plaid Link](https://plaid.com/docs/link/)
- [Transactions Sync](https://plaid.com/docs/api/products/transactions/#transactionssync)
- [Webhook verification](https://plaid.com/docs/api/webhooks/webhook-verification/)
