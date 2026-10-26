# `@ottoai/zuno-testing`

This package supplies deterministic test utilities for Zuno provider packages.

Do not use memory stores for production token persistence. The stable `0.1` API follows Semantic
Versioning.

## Install

```bash
pnpm add --save-dev @ottoai/zuno-testing
```

## Record Safe Fixtures

```ts
import { createRecordingFetch } from '@ottoai/zuno-testing'

const recordings = []
const fetch = createRecordingFetch({
  fetch: globalThis.fetch,
  onRecord: (recording) => {
    recordings.push(recording)
  },
})
```

The recorder removes common secret headers, query parameters, and JSON fields. Text bodies are
omitted by default.

## Replay Fixtures

```ts
import { createReplayFetch } from '@ottoai/zuno-testing'

const replay = createReplayFetch(recordings)
const client = createProviderClient({ fetch: replay.fetch })
```

## Check a Provider Manifest

```ts
import { assertProviderManifestConforms } from '@ottoai/zuno-testing'

await assertProviderManifestConforms(providerManifest)
```

Use `runConformanceSuite` to add provider-specific checks without a dependency on one test
framework.
