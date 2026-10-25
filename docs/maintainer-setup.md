# Maintainer Setup

## Purpose

Complete these tasks before the first public package release.

## npm Organization

1. The `ottoai` npm organization exists.
2. The authenticated npm account is `toolsotto`.
3. The `toolsotto` account is an organization owner.
4. The organization requires two-factor authentication.
5. Publish each package for the first time at version `0.1.0`.

The initial packages are:

- `@ottoai/zuno`
- `@ottoai/zuno-oauth`
- `@ottoai/zuno-testing`
- `@ottoai/zuno-quickbooks`
- `@ottoai/zuno-plaid`
- `@ottoai/zuno-compat-unified`

## Trusted Publishing

Publish each package once with an authenticated maintainer account. Use staged publishing when the
npm organization supports it. Revoke any temporary publication token after the bootstrap release.

Create one trusted publisher for each published package.

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

- Security contact: `security@joinotto.com`
- Conduct contact: `conduct@joinotto.com`

## Package Ownership

The initial core maintainer is `geekfarmer`. The initial npm bootstrap publisher is `toolsotto`.

Add a second maintainer before a provider package reaches the `official` support level.

## First Release

Do not publish version `0.0.0`. Create a changeset for version `0.1.0`. Run the release workflow
after all controls are active.
