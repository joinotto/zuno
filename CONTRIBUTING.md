# Contributing to Zuno

## Current Contribution Status

The project does not accept external code at this time.
The maintainers must first approve the license and provenance review.

You can open a discussion about the design.
Do not submit copied provider code or customer data.

## Before You Start

1. Read the [product scope](./docs/product-scope.md).
2. Read the [architecture](./docs/architecture.md).
3. Read the [documentation standard](./docs/documentation-standard.md).
4. Search existing issues.
5. Open an issue for a large change.
6. Wait for maintainer approval.

## Development Requirements

Use the runtime versions that the repository configuration specifies.
Use `pnpm` after the workspace migration is complete.

Do not add a dependency without a license review.
Do not commit credentials or production data.

## Change Process

1. Create a focused branch.
2. Make one logical change.
3. Add or update tests.
4. Update public documentation.
5. Add a changeset for a package change.
6. Run all required checks.
7. Complete the pull request template.
8. Request maintainer review.

## Provider Changes

A provider change must include:

- provider manifest changes
- provider-native types
- sanitized fixtures
- unit tests
- sandbox test instructions
- supported API version
- rate-limit behavior
- error behavior
- security considerations

Do not add an operation only to match another provider.
Add an operation when the provider supports the operation.

## Fixture Rules

Use synthetic provider accounts when possible.
Remove names, emails, addresses, tokens, and account numbers.
Replace identifiers with stable fake identifiers.

Do not change a value when the value controls test behavior.
Record the reason for each retained sensitive field.

## Documentation Rules

Follow [Documentation Standard](./docs/documentation-standard.md).
Use the same term for the same item.
Verify all commands before review.

## Commit Rules

Use a short imperative subject.
Keep unrelated changes in separate commits.
Do not rewrite another contributor's commit without permission.

## Pull Request Review

The reviewer checks:

- product scope
- architecture boundaries
- public API stability
- tests
- documentation
- security
- data privacy
- dependency licenses
- provenance

Two approvals are required for a security-sensitive change.
One approval is required for other changes.

## Contributor Rights

Submit only work that you have the right to contribute.
Identify copied or adapted work in the pull request.
Include all required copyright and license notices.

The project will define the contributor license process before public launch.
