# Maintainer Setup

## Purpose

Complete these tasks before the first public package release.

## npm Organization

1. Create or confirm the `zuno` npm organization.
2. Add the required maintainers.
3. Require two-factor authentication.
4. Reserve `@zuno/core`.
5. Reserve `@zuno/oauth`.
6. Reserve `@zuno/testing`.
7. Reserve `@zuno/quickbooks`.
8. Reserve `@zuno/plaid`.
9. Reserve `@zuno/compat-unified`.

The current computer is not authenticated to npm. A maintainer must complete the npm organization
tasks.

## Trusted Publishing

Create one trusted publisher for each package.

Use these values:

- GitHub organization: `joinotto`
- GitHub repository: `zuno`
- workflow file: `release.yml`
- environment: `npm`

Do not create a long-lived npm token for CI.

## GitHub Repository

1. Protect the `main` branch.
2. Require the `Quality` check.
3. Require the Node.js runtime checks.
4. Require the CodeQL check.
5. Require the dependency review check.
6. Require one approving review.
7. Block force pushes after the clean-history update.
8. Enable private vulnerability reporting.
9. Enable secret scanning.
10. Enable push protection.
11. Create the protected `npm` environment.
12. Add one required reviewer to the `npm` environment.
13. Enable OpenSSF Scorecard result publication.

## Private Contacts

Publish one private security contact. Publish one private conduct contact.

Replace the temporary repository-owner instructions in:

- `SECURITY.md`
- `CODE_OF_CONDUCT.md`

## Package Ownership

Assign one package signing owner. Assign two maintainers to each official provider package.

Record the maintainers in `GOVERNANCE.md`.

## First Release

Do not publish version `0.0.0`. Create a changeset for version `0.1.0`. Run the release workflow
after all controls are active.
