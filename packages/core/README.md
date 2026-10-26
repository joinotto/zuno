# `@ottoai/zuno`

This package supplies shared runtime primitives for Zuno provider packages.

The package contains no provider business models. The stable `0.1` API follows Semantic Versioning.

## Install

```bash
pnpm add @ottoai/zuno
```

## Create a Transport

```ts
import { createTransport } from '@ottoai/zuno'

const transport = createTransport({
  baseUrl: 'https://api.provider.example/v1',
  provider: 'example',
  timeoutMs: 30_000,
})

const account = await transport.request<{ id: string }>({
  operation: 'accounts.get',
  path: '/accounts/123',
})
```

The transport retries safe requests. Add an idempotency key to retry an unsafe request.

```ts
await transport.request({
  idempotencyKey: crypto.randomUUID(),
  init: {
    body: JSON.stringify({ name: 'New record' }),
    method: 'POST',
  },
  operation: 'records.create',
  path: '/records',
})
```

## Main Exports

- `createTransport` creates an injected Fetch transport.
- `iteratePages` and `iterateItems` process cursor pagination.
- `defineProviderManifest` defines a typed provider manifest.
- `redact` removes common credential fields from structured data.
- `ZunoError` is the base SDK error.

See the repository API reference for the complete export list.
