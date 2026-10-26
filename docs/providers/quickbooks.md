# QuickBooks Provider

## Purpose

The QuickBooks provider connects a Node.js application to QuickBooks Online.

Use the main entry point for provider-native access. Use the compatibility entry point when an
application needs the Ledger accounting model.

## Supported Environments

- QuickBooks Online sandbox
- QuickBooks Online production

## Supported Operations

The provider supports:

- OAuth authorization, code exchange, refresh, and revocation
- company information
- accounts
- customers and suppliers
- classes and departments
- accounting transactions
- deleted transaction discovery with CDC
- profit and loss
- balance sheet
- cash flow
- trial balance
- grouped reports

The provider does not implement QuickBooks webhooks in version `0.1`.

## Token Handling

QuickBooks can rotate a refresh token during refresh. The application must commit the new token
before it discards the old token.

Use one refresh lock for each connection. Do not let two workers refresh the same connection at the
same time.

The SDK requests one forced token refresh after a `401` response. The supplied access-token function
must persist a rotated refresh token.

## Date Ranges

Compatibility report and transaction operations accept:

- `startGte` as an inclusive start date
- `endLt` as an exclusive end date

The client converts an exclusive end date to the inclusive QuickBooks report end date.

An empty report date range requests all available provider data.

## Transactions

The client queries supported native QuickBooks transaction entities. It also uses the General Ledger
report when native entities do not supply complete double-entry data.

The compatibility mapper:

- creates debit and credit legs
- preserves QuickBooks transaction IDs
- maps account and split-account relationships
- maps customers and suppliers
- reconciles transaction direction
- keeps source payloads in `raw`

## Reports

The report mapper preserves report sections even when an amount is zero. This behavior keeps cost of
goods sold, utilities, investing, and other valid sections.

When available, the mapper adds General Ledger transaction IDs to report rows.

## Support

The provider has the `community` support level. `geekfarmer` is the named provider maintainer.
