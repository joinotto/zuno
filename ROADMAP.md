# Zuno Roadmap

## Purpose

This roadmap describes current work and planned provider packages. It does not promise release
dates.

## Current Release

Zuno has stable public `0.1` packages:

- `@ottoai/zuno`
- `@ottoai/zuno-oauth`
- `@ottoai/zuno-testing`
- `@ottoai/zuno-quickbooks`

QuickBooks Online is the first stable provider. The package includes OAuth, native API access,
accounting operations, transactions, and reports.

## Status Terms

- **Stable** means the package has a non-prerelease version and follows Semantic Versioning.
- **Active** means implementation or validation is in progress.
- **Planned** means the maintainers approved the provider direction.
- **Discovery** means API access, scope, and maintenance requirements still need validation.
- **Proposed** means the project has not approved implementation.

## Completed: Project Foundation

- Selected the Apache License 2.0.
- Published packages under the `@ottoai` npm organization.
- Configured npm trusted publishing and provenance.
- Added protected release environments.
- Added continuous integration, CodeQL, dependency review, and OpenSSF Scorecard.
- Added contribution, governance, support, and security policies.
- Added ASD-STE100-based documentation rules.

## Completed: Shared SDK Packages

- Added Fetch-based transport.
- Added timeouts, cancellation, retries, and `Retry-After` support.
- Added typed provider errors and request metadata.
- Added pagination and lifecycle hooks.
- Added OAuth state, PKCE, token, and refresh-lock contracts.
- Added secret redaction and deterministic fixture tools.
- Added provider manifests and conformance tests.

## Stable: QuickBooks Online

Package: `@ottoai/zuno-quickbooks`

Delivered capabilities:

- OAuth authorization, exchange, refresh, and revocation
- production and sandbox environments
- company information
- accounts, customers, suppliers, classes, and departments
- native transaction queries
- General Ledger transaction reconstruction
- deleted transaction detection
- profit and loss
- balance sheet
- cash flow
- trial balance
- grouped reports
- Ledger-compatible accounting mappings

Current stabilization work:

1. Monitor the first production consumer.
2. Complete staged migration from Unified to Zuno.
3. Expand sanitized regression fixtures.
4. Add attachment operations.
5. Add webhook verification.
6. Publish a complete runnable OAuth example.

## Planned Next: Plaid

Package: `@ottoai/zuno-plaid`

Purpose:

Validate that the category-neutral core works for banking data and cursor-based synchronization.

Planned capabilities:

1. Link token creation.
2. Public token exchange.
3. Item and institution operations.
4. Account and balance retrieval.
5. Transactions Sync.
6. Identity and liability operations.
7. Webhook verification.
8. Item error and reauthorization handling.
9. Sandbox fixtures and tests.
10. Optional application adapters.

Exit conditions:

- Plaid types remain inside the Plaid package.
- QuickBooks types remain inside the QuickBooks package.
- Both providers use the same transport, OAuth, error, and testing primitives.
- Cursor synchronization has restart and replay tests.

## Discovery: HoneyBook

Package: `@ottoai/zuno-honeybook`

Purpose:

Add a client for HoneyBook workflows without creating a universal CRM model.

Discovery tasks:

1. Confirm public or partner API access.
2. Confirm OAuth and webhook requirements.
3. Record supported resources and rate limits.
4. Define the first provider-native client surface.
5. Confirm test-account and fixture requirements.
6. Complete dependency, license, and security reviews.

Candidate capabilities:

- projects
- contacts
- invoices and payments
- sessions or meetings
- files
- webhooks

The final capability list depends on approved HoneyBook API access.

## Planned: Community Provider Framework

The project will make provider contributions consistent and reviewable.

Planned work:

1. Publish a provider template.
2. Publish a provider manifest schema.
3. Publish provider conformance suites.
4. Publish fixture-redaction guidance.
5. Define provider support levels and maintainer duties.
6. Add provider ownership rules.
7. Add package-size and compatibility reports.

Candidate community providers:

- Xero
- Sage
- Stripe
- Google Drive
- Dropbox
- Slack
- Microsoft Teams

## Future: Optional Hosted Services

Zuno remains package-first. Optional hosted services can include:

- OAuth callback handling
- encrypted connection storage
- webhook delivery
- durable synchronization workers
- connection health monitoring

Self-hosted applications must not require these services.

## Release Plan

- `0.1.x` stabilizes the shared packages and QuickBooks.
- `0.2.x` completes production adoption and migration tooling.
- `0.3.x` introduces Plaid.
- A later `0.x` release can introduce HoneyBook after discovery.
- `1.0.0` requires stable contracts across at least two provider categories.

## Next Actions

1. Complete the QuickBooks production observation period.
2. Merge the Ledger direct-package migration.
3. Publish a QuickBooks OAuth example application.
4. Create the Plaid provider design and capability manifest.
5. Confirm Plaid sandbox credentials and test data.
6. Start the HoneyBook API-access assessment.
