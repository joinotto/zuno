<p align="center">
  <img src="https://raw.githubusercontent.com/joinotto/zuno/main/docs/assets/zuno-header.svg" alt="Zuno. Provider-native TypeScript integration SDKs." width="100%">
</p>

<p align="center">
  <a href="https://github.com/joinotto/zuno/actions/workflows/ci.yml"><img alt="Continuous integration" src="https://github.com/joinotto/zuno/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@ottoai/zuno-quickbooks"><img alt="QuickBooks npm version" src="https://img.shields.io/npm/v/%40ottoai%2Fzuno-quickbooks?label=quickbooks"></a>
  <a href="https://www.npmjs.com/package/@ottoai/zuno-plaid"><img alt="Plaid npm version" src="https://img.shields.io/npm/v/%40ottoai%2Fzuno-plaid?label=plaid"></a>
  <a href="https://github.com/joinotto/zuno/blob/main/LICENSE"><img alt="Apache License 2.0" src="https://img.shields.io/badge/license-Apache--2.0-blue"></a>
  <a href="https://github.com/joinotto/zuno/blob/main/SECURITY.md"><img alt="Security policy" src="https://img.shields.io/badge/security-policy-green"></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#packages">Packages</a> ·
  <a href="#providers">Providers</a> ·
  <a href="https://github.com/joinotto/zuno/blob/main/ROADMAP.md">Roadmap</a> ·
  <a href="https://github.com/joinotto/zuno/blob/main/CONTRIBUTING.md">Contributing</a> ·
  <a href="https://github.com/joinotto/zuno/blob/main/SECURITY.md">Security</a>
</p>

Zuno is an open-source TypeScript project for provider-native integrations. Each provider package
keeps the provider's names, fields, identifiers, and behavior. Zuno does not force unrelated
providers into one universal model.

QuickBooks Online is stable. Plaid is available as an alpha package. HoneyBook is in discovery.

## Why Zuno

- Install only the providers that your application uses.
- Keep access to native provider data.
- Use shared transport, OAuth, retry, pagination, and test tools.
- Store tokens and tenant data in your application.
- Use the packages without a hosted Zuno service.
- Release and upgrade each provider independently.

## Quick Start

Install a provider package:

```bash
npm install @ottoai/zuno-quickbooks
npm install @ottoai/zuno-plaid@next
```

Create a QuickBooks client:

```ts
import { QuickBooksAccountingClient, QuickBooksClient } from '@ottoai/zuno-quickbooks'

const provider = new QuickBooksClient({
  environment: 'production',
  getAccessToken: readOrRefreshAccessToken,
  realmId: 'quickbooks-realm-id',
})

const accounting = new QuickBooksAccountingClient(provider)
const accounts = await accounting.listAccounts()
```

Create a Plaid client:

```ts
import { PlaidClient } from '@ottoai/zuno-plaid'

const plaid = new PlaidClient({
  clientId: process.env.PLAID_CLIENT_ID!,
  environment: 'sandbox',
  secret: process.env.PLAID_SECRET!,
})

const link = await plaid.createLinkToken({
  client_name: 'Example application',
  country_codes: ['US'],
  language: 'en',
  products: ['transactions'],
  user: {
    client_user_id: 'application-user-id',
  },
})
```

Applications own OAuth state, encrypted credentials, tenant isolation, databases, queues, and
retention policies.

## Providers

| Provider          | Package                   | Status       |
| ----------------- | ------------------------- | ------------ |
| QuickBooks Online | `@ottoai/zuno-quickbooks` | Stable `0.1` |
| Plaid             | `@ottoai/zuno-plaid`      | Alpha `0.1`  |
| HoneyBook         | `@ottoai/zuno-honeybook`  | Discovery    |

The status describes the Zuno package. It does not describe provider uptime or API access.

## Packages

### `@ottoai/zuno`

Shared runtime primitives:

- Fetch-based transport
- timeouts and cancellation
- bounded retries
- cursor pagination
- typed errors
- lifecycle hooks
- provider manifests
- secret redaction

### `@ottoai/zuno-oauth`

Provider-neutral OAuth primitives:

- authorization URLs
- state and PKCE helpers
- token contracts
- coordinated token refresh
- refresh-lock contracts

### `@ottoai/zuno-quickbooks`

QuickBooks Online operations:

- OAuth exchange, refresh, and revocation
- accounts, contacts, categories, and transactions
- profit and loss, balance sheet, cash flow, and trial balance
- grouped reports
- optional accounting compatibility mappings

### `@ottoai/zuno-plaid`

Plaid operations:

- Link and Item operations
- accounts, balances, and Auth
- transaction synchronization, recurring streams, and enrichment
- statements and verified PDF downloads
- investments and liabilities
- Asset Reports and processor tokens
- signed webhook verification

### `@ottoai/zuno-testing`

Provider development tools:

- sanitized HTTP recording
- deterministic fixture replay
- memory token providers
- provider manifest checks
- conformance tests

## Project Rules

- Provider packages use native provider names and fields.
- Applications own credentials, databases, tenants, and queues.
- Core packages contain no accounting, banking, CRM, or storage model.
- Provider packages do not require a hosted Zuno service.
- Public operations include tests and documentation.
- Logs and fixtures must not contain secrets or customer data.

## Documentation

- [Getting started](https://github.com/joinotto/zuno/blob/main/docs/getting-started.md)
- [API reference](https://github.com/joinotto/zuno/blob/main/docs/api-reference.md)
- [Architecture](https://github.com/joinotto/zuno/blob/main/docs/architecture.md)
- [Provider design](https://github.com/joinotto/zuno/blob/main/docs/provider-sdk-design.md)
- [QuickBooks guide](https://github.com/joinotto/zuno/blob/main/docs/providers/quickbooks.md)
- [Plaid guide](https://github.com/joinotto/zuno/blob/main/docs/providers/plaid.md)
- [Roadmap](https://github.com/joinotto/zuno/blob/main/ROADMAP.md)

## Compatibility

The stable `0.1` packages require Node.js `22.18.0` or later and use ESM.

Zuno follows Semantic Versioning. A provider package can release without changing other packages.

## Support

Use [GitHub issues](https://github.com/joinotto/zuno/issues) for verified defects. Use
[GitHub discussions](https://github.com/joinotto/zuno/discussions) for design questions.

Report security issues through
[private vulnerability reporting](https://github.com/joinotto/zuno/security/advisories/new) or
`security@joinotto.com`.

## License

Zuno uses the Apache License 2.0.
