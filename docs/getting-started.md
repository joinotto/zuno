# Getting Started

## Requirements

- Node.js 22.18.0 or later
- an application-owned Fetch implementation
- secure token persistence for OAuth providers

## Install Core Packages

```bash
pnpm add @ottoai/zuno @ottoai/zuno-oauth
pnpm add --save-dev @ottoai/zuno-testing
```

The first public release will use a prerelease version. Do not use an experimental release without
an application rollback plan.

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

## Next Step

Read the API reference. Then read the provider package documentation.
