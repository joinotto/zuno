# Open-Source Policy

## Purpose

This policy defines the minimum controls for public Zuno development.

## Package Release Controls

The project completed the bootstrap publication and configured npm trusted publishing.

Before each release:

- add an approved changeset
- pass continuous integration
- pass package-content and type checks
- publish from the protected release workflow
- create npm provenance

The project still requires a second core maintainer before it marks a provider as `official`.

## Required Repository Files

The public repository must contain:

- `README.md`
- `LICENSE`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `SUPPORT.md`
- `GOVERNANCE.md`
- `CHANGELOG.md`
- issue templates
- pull request template

## Contribution Rules

1. Require a linked issue for a large change.
2. Require tests for behavior changes.
3. Require documentation for public API changes.
4. Require a changeset for package changes.
5. Require a provenance statement for copied code.
6. Require a license review for new dependencies.
7. Require secret scans.
8. Require maintainer approval.

## Supply-Chain Controls

The release process must:

- pin GitHub Actions by commit digest
- use least-privilege workflow permissions
- use npm trusted publishing
- create npm provenance attestations
- generate a software bill of materials
- scan dependencies
- scan published package contents
- prevent untracked build output
- use protected release environments

## Dependency Rules

Before the project adds a dependency, verify:

1. The package has an approved license.
2. The package has active maintenance.
3. The package does not add unnecessary runtime code.
4. The package has no known critical vulnerability.
5. The package supports the required runtimes.

Record an exception in an architecture decision record.

## Security Rules

- Do not put secrets in code.
- Do not put secrets in fixtures.
- Do not put customer data in tests.
- Redact credentials from logs.
- Validate webhook signatures.
- Validate OAuth state.
- Encrypt stored tokens.
- Limit token access.
- Rotate compromised credentials.

## Community Support Levels

Use these support levels:

- `official` means the core maintainers support the provider.
- `community` means named community maintainers support the provider.
- `experimental` means the API can change without notice.
- `deprecated` means the package has a removal plan.

Each provider manifest must state one support level.

## Release Rules

Use Semantic Versioning for public packages. Use Changesets for release notes and version changes.
Maintain an `Unreleased` section in `CHANGELOG.md`.

Do not release from a local developer computer. Release only from the protected release workflow.

## References

- [GitHub Open Source Guides](https://opensource.guide/)
- [OpenSSF Scorecard](https://scorecard.dev/)
- [OpenSSF Best Practices Badge](https://www.bestpractices.dev/)
- [REUSE specification](https://reuse.software/spec/)
- [SPDX](https://spdx.dev/)
