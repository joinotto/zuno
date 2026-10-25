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

The repository has these controls:

1. The `main` branch is protected.
2. The `Quality` check is required.
3. The Node.js runtime checks are required.
4. The CodeQL check is required.
5. The dependency review check is required.
6. One approving review is required.
7. Force pushes and branch deletion are blocked.
8. Private vulnerability reporting is enabled.
9. Secret scanning is enabled.
10. Push protection is enabled.
11. Dependabot security updates are enabled.
12. The protected `npm` environment exists.
13. The `npm` environment requires approval from `geekfarmer`.

OpenSSF Scorecard runs on pushes, pull requests, schedule events, and branch protection changes.
Public Scorecard result publication remains disabled until the project approves external
publication.

## Private Contacts

- Security contact: `security@joinotto.com`
- Conduct contact: `conduct@joinotto.com`

## Package Ownership

The initial core maintainer is `geekfarmer`. The initial npm bootstrap publisher is `toolsotto`.

Add a second maintainer before a provider package reaches the `official` support level.

## First Release

Do not publish version `0.0.0`. Create a changeset for version `0.1.0`. Run the release workflow
after all controls are active.
