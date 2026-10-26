# Maintainer Setup

## Purpose

This document records the active maintainer and release controls.

## npm Organization

1. The `ottoai` npm organization exists.
2. The organization requires two-factor authentication.
3. Each maintainer uses an individual npm account.
4. The stable packages use version `0.1.0` or later.

The initial packages are:

- `@ottoai/zuno`
- `@ottoai/zuno-oauth`
- `@ottoai/zuno-testing`
- `@ottoai/zuno-quickbooks` Plaid is not published.

## Trusted Publishing

Each published package has a trusted publisher. Releases use GitHub Actions and npm OpenID Connect.

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
6. Reviewer approval is optional during the initial single-maintainer phase.
7. Only `geekfarmer` can merge or update the protected `main` branch.
8. Force pushes and branch deletion are blocked.
9. Private vulnerability reporting is enabled.
10. Secret scanning is enabled.
11. Push protection is enabled.
12. Dependabot security updates are enabled.
13. The protected `npm` environment exists.
14. The `npm` environment requires approval from `geekfarmer`.

OpenSSF Scorecard runs on pushes, pull requests, schedule events, and branch protection changes.
Public Scorecard result publication remains disabled until the project approves external
publication.

## Private Contacts

- Security contact: `security@joinotto.com`
- Conduct contact: `conduct@joinotto.com`

## Package Ownership

The initial core maintainer is `geekfarmer`.

Add a second maintainer before a provider package reaches the `official` support level.

## Release Process

1. Add a changeset for each public package change.
2. Open a focused pull request.
3. Pass all required checks.
4. Merge the pull request.
5. Run `pnpm version-packages` on a release branch.
6. Open and merge the release pull request.
7. Run the protected `release.yml` workflow.
8. Approve the `npm` environment deployment.
9. Verify the npm version, tag, provenance, and package contents.
