# Plaid Provider Plan

## Status

Planned next. The package is not published.

Proposed package: `@ottoai/zuno-plaid`

## Purpose

The Plaid provider will supply provider-native banking operations. It will also validate that the
shared Zuno packages work outside accounting.

## Planned First Scope

- Link token creation
- public token exchange
- Item and institution operations
- accounts and balances
- Transactions Sync
- identity and liabilities
- webhook verification and parsing
- Item errors and reauthorization

## Application Responsibilities

The application will own:

- users and tenants
- encrypted access-token storage
- synchronization cursors
- webhook delivery records
- retention and deletion policy
- provider consent and product configuration

## Delivery Conditions

The first release must:

1. Use provider-native Plaid types.
2. Keep banking models out of `@ottoai/zuno`.
3. Include sandbox fixtures and tests.
4. Test cursor restart and replay behavior.
5. Verify webhook signatures.
6. Document supported Plaid products.
7. Document API-version and environment requirements.
