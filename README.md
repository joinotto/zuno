# Zuno

Zuno is an open-source TypeScript SDK for external integrations.

Each provider package keeps the native provider model. Zuno does not force different providers into
one data model.

## Project Status

The project is in active development. The current packages are experimental.

The project uses the Apache License 2.0. The clean public history contains project-owned work.

The shared transport, OAuth, and testing packages are implemented. The QuickBooks package currently
contains its provider boundary and capability manifest.

## Available Packages

- `@ottoai/zuno` supplies transport, errors, retries, hooks, and pagination.
- `@ottoai/zuno-oauth` supplies OAuth 2.0 operations and token contracts.
- `@ottoai/zuno-quickbooks` supplies the QuickBooks Online client.
- `@ottoai/zuno-testing` supplies fixtures and provider test tools.

Install the current alpha packages:

```bash
npm install @ottoai/zuno@alpha @ottoai/zuno-oauth@alpha
npm install @ottoai/zuno-quickbooks@alpha
npm install --save-dev @ottoai/zuno-testing@alpha
```

## Planned Packages

- `@ottoai/zuno-plaid` will supply the Plaid client.

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
- [Getting started](./docs/getting-started.md)
- [API reference](./docs/api-reference.md)
- [Documentation standard](./docs/documentation-standard.md)
- [Open-source policy](./docs/open-source-policy.md)
- [License and provenance review](./docs/license-and-provenance.md)
- [Provenance audit](./docs/provenance-audit-2026-10-25.md)
- [Provider SDK design](./docs/provider-sdk-design.md)
- [Contribution guide](./CONTRIBUTING.md)
- [Governance](./GOVERNANCE.md)
- [Security policy](./SECURITY.md)
- [Support policy](./SUPPORT.md)
- [Maintainer setup](./docs/maintainer-setup.md)

## First Delivery

The first delivery implements a provider-native QuickBooks client. Compatibility tests will compare
the package with approved provider fixtures.

Plaid is the second provider. Plaid will test the category-neutral core design.

## Documentation Language

Public documentation follows the project writing rules. The rules use ASD-STE100 Issue 9 principles.

The project does not claim certified ASD-STE100 conformance. Certified conformance requires the
official specification and a qualified review.

## License

Zuno uses the Apache License 2.0. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
