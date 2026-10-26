# Getting Started

## Requirements

- Node.js 22.18.0 or later
- an application-owned Fetch implementation
- secure token persistence for OAuth providers

## Install a Provider

```bash
pnpm add @ottoai/zuno-quickbooks
```

The provider installs its required shared packages. Install core packages directly only when you
build a provider or custom transport.

Use exact versions in production lockfiles. Test provider upgrades before deployment.

## Create a Provider Transport

```ts
import { createTransport } from '@ottoai/zuno'

export const transport = createTransport({
  baseUrl: 'https://api.provider.example',
  fetch: globalThis.fetch,
  provider: 'example',
  retry: {
    maxAttempts: 3,
  },
})
```

Supply a custom Fetch implementation for proxies, tracing, tests, or non-Node runtimes.

## Add OAuth Storage

```ts
import type { TokenProvider } from '@ottoai/zuno-oauth'

export class DatabaseTokenProvider implements TokenProvider {
  async clear(): Promise<void> {
    // Delete encrypted tokens.
  }

  async get() {
    // Read and decrypt tokens.
    return null
  }

  async set(tokens) {
    // Encrypt and store tokens.
  }
}
```

The application owns encryption, tenant isolation, retention, and audit controls.

## Test Without Network Access

```ts
import { createTransport } from '@ottoai/zuno'
import { createJsonResponse, createFetchQueue } from '@ottoai/zuno-testing'

const queue = createFetchQueue([
  createJsonResponse({
    id: 'record-1',
  }),
])

const testTransport = createTransport({
  baseUrl: 'https://provider.test',
  fetch: queue.fetch,
  provider: 'example',
})
```

## Connect to QuickBooks

```ts
import {
  QuickBooksAccountingClient,
  QuickBooksClient,
  QuickBooksOAuth,
} from '@ottoai/zuno-quickbooks'

const oauth = new QuickBooksOAuth({
  clientId: process.env.QUICKBOOKS_CLIENT_ID!,
  clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
  redirectUri: process.env.QUICKBOOKS_REDIRECT_URI!,
})

const authorizationUrl = oauth.getAuthorizationUrl('verified-oauth-state')

const provider = new QuickBooksClient({
  environment: 'production',
  getAccessToken: readOrRefreshAccessToken,
  realmId: 'quickbooks-realm-id',
})

const accounting = new QuickBooksAccountingClient(provider)
const accounts = await accounting.listAccounts()
```

The application must persist encrypted tokens and validate the OAuth state. The SDK does not own
these controls.

## Next Step

Read the API reference. Then read the QuickBooks provider guide.
