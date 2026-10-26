# Provider SDK Design

## Purpose

This document records reusable SDK design choices. Official provider documentation is the
implementation authority.

## Clean Implementation Rule

Document observable behavior before implementation. Create tests from authorized and sanitized
fixtures. Implement each operation from official provider documentation.

Do not copy code without a license review. Preserve required notices for approved third-party code.
Record approved imports in the provenance log.

## Adopted Patterns

### Operation Namespaces

Use focused operation groups.

```ts
quickbooks.accounts.list()
quickbooks.contacts.create()
quickbooks.reports.profitAndLoss()
```

This structure improves discovery and limits each client module.

### Injected Fetch

Accept an injected Fetch implementation. Accept timeout, retry, hook, and logging options.

This design supports Node.js and other Fetch-compatible runtimes.

### Structured Retry Control

Classify network errors and HTTP status codes. Limit each retry sequence. Honor `Retry-After`.

Do not retry an unsafe operation without an idempotency key.

### Typed Errors

Use a small and stable error hierarchy. Include provider metadata in each error.

Redact response data before exposure.

### Runtime Validation

Validate public input. Validate provider data that controls application behavior.

Do not expose generated schemas as the primary public API.

### Pagination

Support page control and asynchronous iteration.

```ts
for await (const account of quickbooks.accounts.iterate()) {
  processAccount(account)
}
```

### Raw Responses

Provide an explicit full-response mode. Include provider headers and request identifiers.

Do not require a universal response envelope.

## Rejected Patterns

### Universal Business Models

Do not define one account or transaction model for all providers. Universal models lose provider
details.

### Category Base Classes

Do not require all providers in one category to implement the same methods.

Use provider manifests and focused clients.

### Hosted Connection Requirements

Do not require a Zuno connection identifier. Applications supply token providers and connection
keys.

### Generated Public Surfaces

Do not use generated code as the product architecture. Place generated code behind a curated API.

### Hidden Provider Differences

Do not hide provider behavior differences. Document each difference in the provider package.
