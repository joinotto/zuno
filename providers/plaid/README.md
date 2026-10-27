# `@ottoai/zuno-plaid`

This package supplies a provider-native Plaid client for Node.js applications.

The package does not store access tokens, Item identifiers, cursors, webhooks, or tenant data.

## Status

The package is an alpha release. Test each operation with Plaid Sandbox before production use.

## Install

```bash
pnpm add @ottoai/zuno-plaid@next
```

Use Node.js 22.18.0 or later.

## Create a Client

```ts
import { PlaidClient } from '@ottoai/zuno-plaid'

const plaid = new PlaidClient({
  clientId: process.env.PLAID_CLIENT_ID!,
  environment: 'sandbox',
  secret: process.env.PLAID_SECRET!,
})
```

The client supports Plaid Sandbox, Development, and Production.

## Create a Link Token

```ts
const link = await plaid.createLinkToken({
  client_name: 'Example application',
  country_codes: ['US'],
  language: 'en',
  products: ['transactions'],
  user: {
    client_user_id: 'application-user-id',
  },
  webhook: 'https://example.com/webhooks/plaid',
})
```

Send `link.link_token` to Plaid Link. Do not send the Plaid secret to a browser.

## Exchange the Public Token

```ts
const item = await plaid.exchangePublicToken({
  public_token: 'public-sandbox-token',
})
```

Encrypt `item.access_token`. Store it with `item.item_id` and the application tenant identifier.

## Synchronize Transactions

```ts
const result = await plaid.syncAllTransactions({
  access_token: encryptedTokenAfterDecryption,
  cursor: storedCursor,
})

await applyTransactionChanges(result)
await storeCursor(result.next_cursor)
```

Store the new cursor only after all added, modified, and removed records are durable.

The helper restarts pagination after Plaid reports a mutation during pagination.

## Verify Webhooks

Use the exact raw request body. Do not parse and serialize the body before verification.

```ts
const webhook = await plaid.verifyWebhook(
  rawRequestBody,
  request.headers.get('plaid-verification') ?? '',
)
```

The verifier checks the ES256 signature, key expiry, token age, and raw body SHA-256 hash.

## Supported Operations

- Link token creation and retrieval
- public token exchange
- Item retrieval, removal, webhook update, and token rotation
- account and balance retrieval
- Transactions Sync and refresh
- identity retrieval
- liability retrieval
- institution retrieval and search
- webhook verification-key retrieval
- signed webhook verification

## Application Responsibilities

The application must:

- keep client credentials on the server
- encrypt access tokens at rest
- isolate Item data by tenant
- store transaction cursors
- apply synchronization changes atomically
- retain the raw webhook body
- deduplicate webhook deliveries
- handle Item update mode
- remove stored data after Item deletion

## API Version

The default Plaid API version is `2020-09-14`. Set `version` when Plaid requires another version.

## Support

The package uses the `community` support level. `geekfarmer` maintains the initial provider.

Report security issues to `security@joinotto.com`.
