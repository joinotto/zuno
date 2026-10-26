# `@ottoai/zuno-quickbooks`

This package supplies a QuickBooks Online client for Node.js applications.

The package has two entry points:

- `@ottoai/zuno-quickbooks` supplies provider-native OAuth and API operations.
- `@ottoai/zuno-quickbooks/compatibility` supplies the accounting response model that Ledger uses.

The package does not store tokens, own database tables, or manage application tenants.

## Install

```bash
pnpm add @ottoai/zuno-quickbooks
```

Use Node.js 22.18.0 or later.

## Create an OAuth Client

```ts
import { QuickBooksOAuth } from '@ottoai/zuno-quickbooks'

const oauth = new QuickBooksOAuth({
  clientId: process.env.QUICKBOOKS_CLIENT_ID!,
  clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
  redirectUri: process.env.QUICKBOOKS_REDIRECT_URI!,
})

const authorizationUrl = oauth.getAuthorizationUrl('verified-oauth-state')
const tokens = await oauth.exchangeCode('authorization-code')
```

Store and encrypt the returned tokens in your application. QuickBooks rotates refresh tokens.
Replace the stored refresh token after each successful refresh.

## Create a Provider Client

```ts
import { QuickBooksClient } from '@ottoai/zuno-quickbooks'

const quickbooks = new QuickBooksClient({
  environment: 'production',
  getAccessToken: async (forceRefresh) => {
    return forceRefresh ? refreshAndStoreAccessToken() : readAccessToken()
  },
  realmId: 'quickbooks-realm-id',
})

const company = await quickbooks.getCompanyInfo()
const query = await quickbooks.request(
  quickbooks.withMinorVersion(
    quickbooks.companyPath('query?query=SELECT * FROM Account MAXRESULTS 1000'),
  ),
)
```

The client retries one request with `getAccessToken(true)` after a QuickBooks `401` response.

## Use the Accounting Compatibility Client

```ts
import { QuickBooksClient } from '@ottoai/zuno-quickbooks'
import { QuickBooksAccountingClient } from '@ottoai/zuno-quickbooks/compatibility'

const provider = new QuickBooksClient({
  environment: 'production',
  getAccessToken: readOrRefreshAccessToken,
  realmId: 'quickbooks-realm-id',
})

const accounting = new QuickBooksAccountingClient(provider)

const accounts = await accounting.listAccounts()
const transactions = await accounting.listTransactions({
  endLt: '2026-12-31',
  startGte: '2026-01-01',
})
const profitAndLoss = await accounting.listProfitLoss({
  endLt: '2026-12-31',
  startGte: '2026-01-01',
})
```

The compatibility entry point supplies these operations:

- company information
- account list and retrieval
- contact list, retrieval, creation, and update
- category list and retrieval
- transaction list, retrieval, and deleted-ID discovery
- profit and loss
- balance sheet
- cash flow
- trial balance
- grouped reports

Report rows include QuickBooks transaction IDs when the General Ledger report supplies them.

## Application Responsibilities

The application must:

- validate OAuth state
- encrypt access and refresh tokens
- isolate tenant data
- serialize refresh-token changes
- store the new refresh token after refresh
- set request timeouts and monitoring
- validate provider data before database writes

## Support

The package uses the `community` support level. `geekfarmer` maintains the QuickBooks provider.

Report security issues to `security@joinotto.com`.
