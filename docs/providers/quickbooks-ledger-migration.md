# Ledger Migration Guide

## Goal

Replace Ledger-owned QuickBooks transport and mapping code with `@ottoai/zuno-quickbooks`.

Keep Ledger persistence and tenant controls in Ledger.

## Keep in Ledger

Ledger must continue to own:

- `connections` records
- `connection_oauth_session` records
- token encryption
- company and user authorization
- refresh locks
- database transactions
- sync jobs and queues
- provider selection
- audit logs

## Move to the SDK

Use the SDK for:

- QuickBooks authorization URLs
- code exchange, token refresh, and revocation
- authenticated provider requests
- account, contact, category, and transaction operations
- report operations
- QuickBooks-to-Ledger compatibility mappings

## Construction Pattern

```ts
import { QuickBooksClient } from '@ottoai/zuno-quickbooks'
import { QuickBooksAccountingClient } from '@ottoai/zuno-quickbooks/compatibility'

const provider = new QuickBooksClient({
  environment: connection.environment === 'sandbox' ? 'sandbox' : 'production',
  getAccessToken: async (forceRefresh) => {
    return connectionService.getAccessToken(connection.id, { forceRefresh })
  },
  realmId: connection.externalAccountId,
})

const accounting = new QuickBooksAccountingClient(provider, {
  logger,
})
```

Do not pass database repositories into the SDK.

## Migration Sequence

1. Add the exact stable SDK version to Ledger.
2. Add a Ledger adapter that constructs `QuickBooksClient`.
3. Route one test company to the SDK.
4. Compare accounts, contacts, categories, transactions, and reports.
5. Run a full sync for the test company.
6. Compare database row counts and report totals.
7. Monitor token refresh and provider errors for 24 hours.
8. Route more companies in small batches.
9. Remove duplicated Ledger provider code after the final batch.

## Required Validation

For each date macro and custom date range, compare:

- profit and loss sections and totals
- balance sheet sections and totals
- cash flow operating, investing, and financing sections
- trial balance debit and credit totals
- transaction count
- transaction date, memo, amount, account, split account, type, and direction
- report transaction IDs

Also validate:

- customer and supplier reads
- contact creation and update
- deleted transaction discovery
- expired access-token refresh
- rotated refresh-token persistence
- sandbox and production base URLs
- retry and timeout behavior

## Rollback

Keep provider routing in Ledger during the rollout. Route a company back to the previous provider
implementation if an SDK comparison fails.

Do not delete the previous implementation until the monitored rollout is complete.
