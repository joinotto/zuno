# Zuno

Zuno is a planned open-source TypeScript SDK for external integrations.

Each provider package keeps the native provider model.
Zuno does not force different providers into one data model.

## Project Status

The project is in the design phase.
Do not use the current code as a stable SDK.

The repository does not have an approved public license.
Do not publish packages or accept external code until the license review is complete.

The existing Cloudflare Worker is a legacy prototype.
The maintainers will replace it with provider packages.

## Initial Packages

- `@zuno/core` supplies transport, errors, retries, hooks, and pagination.
- `@zuno/oauth` supplies OAuth 2.0 operations and token contracts.
- `@zuno/quickbooks` supplies the QuickBooks Online client.
- `@zuno/plaid` supplies the Plaid client.
- `@zuno/testing` supplies fixtures and provider test tools.
- `@zuno/compat-unified` supplies a temporary Ledger migration adapter.

## Project Rules

- Provider packages use native provider names and fields.
- Applications own tokens, encryption, tenants, databases, and queues.
- Core packages contain no accounting model.
- Provider packages do not depend on hosted Zuno services.
- Public operations include tests and verified documentation.
- Logs and fixtures do not contain secrets or customer data.

## Documents

- [Roadmap](./ROADMAP.md)
- [Product scope](./docs/product-scope.md)
- [Architecture](./docs/architecture.md)
- [Documentation standard](./docs/documentation-standard.md)
- [Open-source policy](./docs/open-source-policy.md)
- [License and provenance review](./docs/license-and-provenance.md)
- [Unified SDK review](./docs/unified-sdk-review.md)
- [Contribution guide](./CONTRIBUTING.md)
- [Governance](./GOVERNANCE.md)
- [Security policy](./SECURITY.md)
- [Support policy](./SUPPORT.md)

## First Delivery

The first delivery extracts the QuickBooks code that Ledger uses.
Compatibility tests will compare the package with the current Ledger behavior.

Plaid is the second provider.
Plaid will test the category-neutral core design.

## Documentation Language

Public documentation follows the project writing rules.
The rules use ASD-STE100 Issue 9 principles.

The project does not claim certified ASD-STE100 conformance.
Certified conformance requires the official specification and a qualified review.

## Legacy Material

The `legacy` directory contains files from the first prototype.
These files are not current product documentation.
Do not distribute these files until the provenance review is complete.

## License

No public license applies at this time.
See [License and provenance review](./docs/license-and-provenance.md).
