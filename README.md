<p align="center">
  <img src="./docs/assets/zuno-header.svg" alt="Zuno. Provider-native TypeScript integration SDKs." width="100%">
</p>

<p align="center">
  <a href="https://github.com/joinotto/zuno/actions/workflows/ci.yml"><img alt="Continuous integration" src="https://github.com/joinotto/zuno/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@ottoai/zuno-quickbooks"><img alt="QuickBooks npm version" src="https://img.shields.io/npm/v/%40ottoai%2Fzuno-quickbooks?label=quickbooks"></a>
  <a href="./LICENSE"><img alt="Apache License 2.0" src="https://img.shields.io/badge/license-Apache--2.0-blue"></a>
  <a href="./SECURITY.md"><img alt="Security policy" src="https://img.shields.io/badge/security-policy-green"></a>
  <a href="https://github.com/joinotto/zuno/actions/workflows/scorecard.yml"><img alt="OpenSSF Scorecard" src="https://github.com/joinotto/zuno/actions/workflows/scorecard.yml/badge.svg"></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#packages">Packages</a> ·
  <a href="#providers">Providers</a> ·
  <a href="./ROADMAP.md">Roadmap</a> ·
  <a href="./CONTRIBUTING.md">Contributing</a> ·
  <a href="./SECURITY.md">Security</a>
</p>

Zuno is an open-source TypeScript project for provider-native integrations. Each provider package
keeps the provider's names, fields, identifiers, and behavior. Zuno does not force unrelated
providers into one universal business model.

QuickBooks Online is the first stable provider. Plaid is next. HoneyBook is in discovery.

## Why Zuno

- Install only the providers that your application uses.
- Keep access to native provider data.
- Use shared transport, OAuth, retry, pagination, and test tools.
- Store tokens and tenant data in your own application.
- Use the packages without a hosted Zuno service.
- Release each provider independently.

## Quick Start

Install the QuickBooks provider:

```bash
npm install @ottoai/zuno-quickbooks
```

Create the provider and accounting clients:

```ts
import { QuickBooksAccountingClient, QuickBooksClient } from '@ottoai/zuno-quickbooks'

const provider = new QuickBooksClient({
  environment: 'production',
  getAccessToken: readOrRefreshAccessToken,
  realmId: 'quickbooks-realm-id',
})

const accounting = new QuickBooksAccountingClient(provider)
const accounts = await accounting.listAccounts()
const profitAndLoss = await accounting.listProfitLoss({
  startGte: '2026-01-01',
  endLt: '2026-12-31',
})
```

Your application must validate OAuth state, encrypt tokens, isolate tenants, and store each rotated
refresh token.

## Providers

| Provider          | Package                   | Status       | Support      |
| ----------------- | ------------------------- | ------------ | ------------ |
| QuickBooks Online | `@ottoai/zuno-quickbooks` | Stable `0.1` | Community    |
| Plaid             | `@ottoai/zuno-plaid`      | Planned next | Not released |
| HoneyBook         | `@ottoai/zuno-honeybook`  | Discovery    | Not released |

The status describes the Zuno package. It does not describe provider uptime or provider API access.

## Packages

### `@ottoai/zuno`

Shared transport and runtime primitives:

- Fetch-based requests
- timeouts and cancellation
- bounded retries
- pagination
- typed errors
- lifecycle hooks
- provider manifests
- secret redaction

### `@ottoai/zuno-oauth`

Provider-neutral OAuth primitives:

- authorization URLs
- OAuth state and PKCE helpers
- token contracts
- coordinated token refresh
- refresh-lock contracts

### `@ottoai/zuno-quickbooks`

QuickBooks Online operations:

- OAuth exchange, refresh, and revocation
- provider-native API requests
- company information
- accounts, contacts, and categories
- transactions and deleted transaction identifiers
- profit and loss, balance sheet, cash flow, and trial balance reports
- grouped reports
- optional accounting compatibility mappings

### `@ottoai/zuno-testing`

Development-only provider tools:

- sanitized HTTP recording
- deterministic fixture replay
- memory token providers
- provider manifest checks
- framework-neutral conformance tests

## Package Model

Applications install provider packages directly:

```bash
npm install @ottoai/zuno-quickbooks
npm install @ottoai/zuno-plaid
```

A provider package installs the shared packages that it needs. Applications do not need an umbrella
package.

```text
Application
  ├─ owns tenants, tokens, databases, queues, and encryption
  ├─ @ottoai/zuno-quickbooks
  └─ @ottoai/zuno-plaid
       ├─ @ottoai/zuno
       └─ @ottoai/zuno-oauth
```

## Project Rules

- Provider packages use native provider names and fields.
- Applications own tokens, encryption, tenants, databases, and queues.
- Core packages contain no accounting, banking, CRM, or storage model.
- Provider packages do not require a hosted Zuno service.
- Public operations include tests and documentation.
- Logs and fixtures do not contain secrets or customer data.

## Documentation

- [Getting started](./docs/getting-started.md)
- [API reference](./docs/api-reference.md)
- [Architecture](./docs/architecture.md)
- [Product scope](./docs/product-scope.md)
- [Provider SDK design](./docs/provider-sdk-design.md)
- [QuickBooks guide](./docs/providers/quickbooks.md)
- [QuickBooks Ledger migration](./docs/providers/quickbooks-ledger-migration.md)
- [Plaid plan](./docs/providers/plaid.md)
- [HoneyBook discovery](./docs/providers/honeybook.md)
- [Roadmap](./ROADMAP.md)
- [Contribution guide](./CONTRIBUTING.md)
- [Support policy](./SUPPORT.md)
- [Security policy](./SECURITY.md)
- [Governance](./GOVERNANCE.md)

## Compatibility

The stable `0.1` packages require Node.js `22.18.0` or later and use ESM.

Zuno follows Semantic Versioning. A provider package can release without changing the version of
other packages.

## Support

QuickBooks has the `community` support level. `geekfarmer` maintains the provider.

Use GitHub issues for verified defects and GitHub discussions for design questions. Report security
issues through GitHub private vulnerability reporting or `security@joinotto.com`.

## License

Zuno uses the Apache License 2.0. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
