# Unified TypeScript SDK Review

## Purpose

This review identifies useful SDK patterns. It does not define a source-copy plan.

## Review Sources

The review uses these local references:

- `@unified-api/typescript-sdk` version `2.85.49`
- the current Ledger Unified client
- the current Ledger Zuno client

Use official provider documentation as the implementation authority.

## Clean-Room Rule

Document observable behavior before implementation. Create tests from authorized and sanitized
fixtures. Implement the provider operation from official provider documentation.

Do not copy code without a license review. Preserve copyright notices for approved copied code.
Record copied code in the provenance log.

## Useful Patterns

### Operation Namespaces

Use focused operation groups.

```ts
quickbooks.accounts.list()
quickbooks.contacts.create()
quickbooks.reports.profitAndLoss()
```

This structure improves discovery. It also limits the size of each client module.

### Injected HTTP Client

Accept an injected `fetch` implementation. Accept timeout, retry, hook, and logging options.

This design supports Node.js and Fetch-compatible runtimes.

### Structured Retry Control

Classify network errors and HTTP status codes. Limit each retry sequence. Honor the `Retry-After`
header. Do not retry unsafe operations without an idempotency key.

### Typed Errors

Use a small and stable error hierarchy. Include provider metadata in each error. Redact response
data before exposure.

### Runtime Validation

Validate public input. Validate provider data that controls application behavior.

Do not expose all generated schemas as the primary API.

### Pagination

Support page control. Also support asynchronous iteration.

```ts
for await (const account of quickbooks.accounts.iterate()) {
  processAccount(account)
}
```

### Raw Responses

Provide an explicit full-response mode. Include provider headers and request identifiers.

Do not require a universal response envelope.

### Standalone Operations

Standalone functions can reduce edge bundle size. Add them only after bundle tests show a benefit.

## Rejected Patterns

### Universal Business Models

Do not define one account or transaction model for all providers. Universal models lose provider
details.

### Category-Wide Base Class

Do not require all accounting providers to implement the same methods. Use provider manifests and
focused clients.

### Hosted Connection Requirement

Do not require a Zuno connection identifier. Applications supply their token provider and connection
key.

### Generated Public Surface

Do not use generated code as the product architecture. Place generated code behind a curated API.

### Hidden Provider Differences

Do not hide provider behavior differences. Document each difference in the provider package.

## Ledger Compatibility

Ledger currently uses Unified-compatible accounting data. This data model must not define the
QuickBooks package.

Use this package split:

```text
@zuno/quickbooks
  Returns QuickBooks-native data.

@zuno/compat-unified
  Returns the temporary Unified-compatible data.

Ledger adapter
  Maps provider data into Ledger rows.
```

Deprecate the compatibility package after Ledger uses its own stable adapter.

## Compatibility Test Process

1. Select one authorized test company.
2. Record sanitized Unified results.
3. Record sanitized QuickBooks results.
4. Compare provider identifiers.
5. Compare dates and amounts.
6. Compare transaction direction.
7. Compare report totals.
8. Compare report transaction identifiers.
9. Record each approved difference.
10. Repeat the test for each date filter.

## Initial Design Comparison

| Concern        | Unified pattern         | Zuno design                         |
| -------------- | ----------------------- | ----------------------------------- |
| HTTP           | Custom client and hooks | Injected `fetch` and hooks          |
| Retry          | Configurable retry      | Provider-aware bounded retry        |
| Errors         | Generated typed errors  | Small stable error hierarchy        |
| Models         | Category schemas        | Provider-native schemas             |
| Connection     | Hosted identifier       | Application token provider          |
| Pagination     | Page iterators          | Page control and async iteration    |
| Validation     | Generated schemas       | Curated runtime validation          |
| Raw data       | Response metadata       | Explicit full-response mode         |
| Authentication | Hosted management       | OAuth package and application store |
| Compatibility  | Main API model          | Optional adapter package            |

## Review Result

Adopt the infrastructure patterns. Do not adopt the universal data model. Do not adopt the hosted
connection dependency.
