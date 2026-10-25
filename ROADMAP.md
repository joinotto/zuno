# Zuno Roadmap

## Purpose

This roadmap defines the work for the first stable Zuno release. It does not define release dates.

## Release Conditions

Zuno must meet these conditions before version `1.0.0`:

- Two provider categories use the same core packages.
- QuickBooks operates in Ledger production.
- Each public operation has tests and documentation.
- Releases include provenance and integrity data.
- The project has an approved license.
- The project has a documented support policy.
- The project has a documented security process.

## Phase 0: Establish the Project

### Objective

Create a safe public project foundation.

### Work

1. Verify the ownership of all repository content.
2. Verify the license of all copied reference material.
3. Select the project license.
4. Confirm the project name and npm scope.
5. Confirm the GitHub organization.
6. Approve the governance model.
7. Configure private security reports.
8. Add automated documentation checks.
9. Mark the Worker code as legacy.
10. Reserve all package names.

### Exit Conditions

- The maintainers approve the license.
- The repository can accept external contributions.
- The repository can publish public packages.
- All public documents pass the documentation review.

## Phase 1: Create the SDK Core

### Objective

Create reusable infrastructure without provider business models.

### Work

1. Create a `pnpm` workspace.
2. Create `@ottoai/zuno`.
3. Create `@ottoai/zuno-oauth`.
4. Create `@ottoai/zuno-testing`.
5. Add an injected `fetch` transport.
6. Add request timeouts and cancellation.
7. Add bounded retry control.
8. Support the `Retry-After` header.
9. Add typed errors.
10. Add request metadata.
11. Add pagination helpers.
12. Add lifecycle hooks.
13. Add token storage contracts.
14. Add a distributed refresh-lock contract.
15. Add automatic secret redaction.
16. Add record-and-replay test tools.
17. Add continuous integration checks.
18. Add package integrity and provenance checks.

### Exit Conditions

- Core packages do not import a database.
- Core packages do not import a web framework.
- Core packages do not contain accounting types.
- A test provider passes the conformance tests.
- Node.js and one Fetch-compatible runtime pass all tests.

## Phase 2: Extract QuickBooks

### Objective

Create `@ottoai/zuno-quickbooks` from verified Ledger behavior.

### Work

1. Document the current Ledger contract.
2. Create sanitized compatibility fixtures.
3. Implement OAuth authorization.
4. Implement callback exchange.
5. Implement token refresh and token revocation.
6. Implement production and sandbox environments.
7. Implement company and connection health operations.
8. Implement accounts and tracking dimensions.
9. Implement customers, vendors, and items.
10. Implement native transaction queries.
11. Implement General Ledger transaction reconstruction.
12. Implement accounting reports.
13. Implement change and deletion detection.
14. Implement attachment operations.
15. Implement webhook verification.
16. Add Intuit request metadata.
17. Add rate-limit behavior.
18. Add sandbox tests.

### Exit Conditions

- The package has no `@ledger/*` dependency.
- Report totals match the approved fixtures.
- Report transaction identifiers match the approved fixtures.
- Transaction direction matches the approved fixtures.
- Token refresh is safe across multiple application instances.

## Phase 3: Add the Ledger Adapter

### Objective

Move Ledger to released Zuno packages.

### Work

1. Create the temporary `@ottoai/zuno-compat-unified` package.
2. Publish a prerelease package.
3. Replace one Ledger workspace import.
4. Run shadow comparisons.
5. Test OAuth and reauthorization.
6. Test synchronization and deletion handling.
7. Test all accounting reports.
8. Test disconnect and rollback operations.
9. Monitor one production company.
10. Monitor a small production group.
11. Move all QuickBooks traffic.
12. Remove the Ledger workspace copy.

### Exit Conditions

- Ledger uses the released QuickBooks package.
- The observation period has no critical difference.
- The rollback procedure is tested.

## Phase 4: Publish QuickBooks Stable

### Objective

Publish the first supported provider package.

### Work

1. Publish API reference documentation.
2. Publish a complete OAuth example.
3. Publish provider capability data.
4. Publish the supported API version.
5. Publish migration instructions.
6. Test installation from the public registry.
7. Publish signed release artifacts.
8. Publish a software bill of materials.

### Exit Conditions

- A new user can connect a sandbox company.
- A new user can list accounts.
- All supported operations have examples.
- The release process is repeatable.

## Phase 5: Add Plaid

### Objective

Test the core design with a banking provider.

### Work

1. Implement Link token creation.
2. Implement public token exchange.
3. Implement Item and institution operations.
4. Implement accounts and balances.
5. Implement identity and liabilities.
6. Implement Transactions Sync.
7. Implement webhook verification.
8. Implement Item error handling.
9. Implement reauthorization.
10. Add sandbox fixtures.
11. Add sandbox tests.
12. Add an optional Ledger adapter.

### Exit Conditions

- Plaid does not add banking types to `@ottoai/zuno`.
- QuickBooks does not add accounting types to `@ottoai/zuno`.
- Both providers use the same transport and test contracts.

## Phase 6: Support Community Providers

### Objective

Make provider contributions consistent and reviewable.

### Work

1. Publish a provider template.
2. Publish a provider manifest schema.
3. Publish provider conformance tests.
4. Publish fixture redaction tools.
5. Define provider support levels.
6. Define provider maintainer duties.
7. Add provider ownership rules.
8. Add package size reports.
9. Add compatibility reports.

### Candidate Providers

- Xero
- Sage
- Google Drive
- Dropbox
- Slack
- Microsoft Teams
- Stripe

## Phase 7: Evaluate Hosted Services

### Objective

Offer optional infrastructure without changing the package-first design.

### Candidate Services

- OAuth callback service
- Encrypted connection store
- Webhook delivery service
- Durable synchronization workers
- Connection health dashboard

Hosted services must use the public Zuno packages. Self-hosted applications must not require hosted
Zuno services.

## Version Plan

- `0.1.x` stabilizes core and QuickBooks APIs.
- `0.2.x` completes the Ledger migration.
- `0.3.x` adds Plaid.
- `1.0.0` provides stable contracts for two provider categories.

## Next Actions

1. Complete the QuickBooks pilot in Ledger.
2. Configure the `@ottoai` npm organization.
3. Approve the architecture.
4. Create the package workspace.
5. Create compatibility fixtures.
6. Publish the first internal prerelease.
