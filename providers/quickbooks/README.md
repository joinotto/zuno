# `@ottoai/zuno-quickbooks`

This package supplies the experimental provider boundary for QuickBooks Online.

The current package exports `quickBooksManifest`. Provider operations are part of Phase 2.

```ts
import { quickBooksManifest } from '@ottoai/zuno-quickbooks'

console.log(quickBooksManifest.capabilities.reports)
```

The package does not contain the Ledger compatibility adapter.
