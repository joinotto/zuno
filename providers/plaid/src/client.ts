// SPDX-License-Identifier: Apache-2.0

import { ProviderApiError, createTransport } from '@ottoai/zuno'
import type { Transport } from '@ottoai/zuno'
import { PlaidApiError } from './errors.js'
import { verifyPlaidWebhook } from './webhook.js'
import type { PlaidBinaryResponse } from './binary.js'
import type {
  AssetReportAuditCopyCreateRequest,
  AssetReportAuditCopyCreateResponse,
  AssetReportAuditCopyRemoveRequest,
  AssetReportAuditCopyRemoveResponse,
  AssetReportCreateRequest,
  AssetReportFilterRequest,
  AssetReportGetRequest,
  AssetReportGetResponse,
  AssetReportPdfGetRequest,
  AssetReportRefreshRequest,
  AssetReportRemoveRequest,
  AssetReportRemoveResponse,
  AssetReportTokenResponse,
} from './types/assets.js'
import type { AuthGetRequest, AuthGetResponse } from './types/auth.js'
import type { TransactionsEnrichRequest, TransactionsEnrichResponse } from './types/enrich.js'
import type {
  InvestmentsHoldingsGetRequest,
  InvestmentsHoldingsGetResponse,
  InvestmentsRefreshRequest,
  InvestmentsTransactionsGetAllResult,
  InvestmentsTransactionsGetRequest,
  InvestmentsTransactionsGetResponse,
} from './types/investments.js'
import type {
  StatementsDownloadRequest,
  StatementsListRequest,
  StatementsListResponse,
  StatementsRefreshRequest,
} from './types/statements.js'
import type {
  TransactionsGetAllResult,
  TransactionsGetRequest,
  TransactionsGetResponse,
  TransactionsRecurringGetRequest,
  TransactionsRecurringGetResponse,
} from './types/transactions.js'
import type {
  AccountsGetRequest,
  AccountsGetResponse,
  IdentityGetRequest,
  IdentityGetResponse,
  InstitutionGetByIdRequest,
  InstitutionGetByIdResponse,
  InstitutionSearchRequest,
  InstitutionSearchResponse,
  ItemAccessTokenInvalidateRequest,
  ItemAccessTokenInvalidateResponse,
  ItemGetRequest,
  ItemGetResponse,
  ItemPublicTokenExchangeRequest,
  ItemPublicTokenExchangeResponse,
  ItemRemoveRequest,
  ItemWebhookUpdateRequest,
  ItemWebhookUpdateResponse,
  LiabilitiesGetRequest,
  LiabilitiesGetResponse,
  LinkTokenCreateRequest,
  LinkTokenCreateResponse,
  LinkTokenGetRequest,
  LinkTokenGetResponse,
  PlaidApiErrorBody,
  PlaidClientOptions,
  PlaidEnvironment,
  PlaidRecord,
  PlaidWebhook,
  TransactionsRefreshRequest,
  TransactionsSyncRequest,
  TransactionsSyncResponse,
  TransactionsSyncResult,
  WebhookVerificationKeyGetRequest,
  WebhookVerificationKeyGetResponse,
} from './types.js'

const baseUrls: Record<PlaidEnvironment, string> = {
  development: 'https://development.plaid.com',
  production: 'https://production.plaid.com',
  sandbox: 'https://sandbox.plaid.com',
}

const defaultPlaidVersion = '2020-09-14'
const mutationDuringPaginationCode = 'TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION'

export class PlaidClient {
  readonly #transport: Transport
  readonly version: string

  constructor(options: PlaidClientOptions) {
    this.version = options.version ?? defaultPlaidVersion
    this.#transport = createTransport({
      baseUrl: baseUrls[options.environment],
      defaultHeaders: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': options.clientId,
        'PLAID-SECRET': options.secret,
        'Plaid-Version': this.version,
      },
      provider: 'plaid',
      ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
      ...(options.hooks === undefined ? {} : { hooks: options.hooks }),
      ...(options.retry === undefined ? {} : { retry: options.retry }),
      ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
    })
  }

  createLinkToken(request: LinkTokenCreateRequest): Promise<LinkTokenCreateResponse> {
    return this.request('/link/token/create', request, 'link.createToken')
  }

  getLinkToken(request: LinkTokenGetRequest): Promise<LinkTokenGetResponse> {
    return this.request('/link/token/get', request, 'link.getToken')
  }

  exchangePublicToken(
    request: ItemPublicTokenExchangeRequest,
  ): Promise<ItemPublicTokenExchangeResponse> {
    return this.request('/item/public_token/exchange', request, 'item.exchangePublicToken')
  }

  getItem(request: ItemGetRequest): Promise<ItemGetResponse> {
    return this.request('/item/get', request, 'item.get')
  }

  removeItem(request: ItemRemoveRequest): Promise<{ request_id: string }> {
    return this.request('/item/remove', request, 'item.remove')
  }

  updateItemWebhook(request: ItemWebhookUpdateRequest): Promise<ItemWebhookUpdateResponse> {
    return this.request('/item/webhook/update', request, 'item.updateWebhook')
  }

  invalidateAccessToken(
    request: ItemAccessTokenInvalidateRequest,
  ): Promise<ItemAccessTokenInvalidateResponse> {
    return this.request('/item/access_token/invalidate', request, 'item.invalidateAccessToken')
  }

  getAccounts(request: AccountsGetRequest): Promise<AccountsGetResponse> {
    return this.request('/accounts/get', request, 'accounts.get')
  }

  getBalances(request: AccountsGetRequest): Promise<AccountsGetResponse> {
    return this.request('/accounts/balance/get', request, 'accounts.getBalances')
  }

  getAuth(request: AuthGetRequest): Promise<AuthGetResponse> {
    return this.request('/auth/get', request, 'auth.get')
  }

  getTransactions(request: TransactionsGetRequest): Promise<TransactionsGetResponse> {
    return this.request('/transactions/get', request, 'transactions.get')
  }

  async getAllTransactions(request: TransactionsGetRequest): Promise<TransactionsGetAllResult> {
    const count = request.options?.count ?? 500
    let offset = request.options?.offset ?? 0
    const result: TransactionsGetAllResult = {
      accounts: [],
      item: {},
      request_ids: [],
      total_transactions: 0,
      transactions: [],
    }

    do {
      const page = await this.getTransactions({
        ...request,
        options: {
          ...request.options,
          count,
          offset,
        },
      })
      result.accounts = page.accounts
      result.item = page.item
      result.total_transactions = page.total_transactions
      result.transactions.push(...page.transactions)
      result.request_ids.push(page.request_id)
      if (page.transactions.length === 0) {
        break
      }
      offset += page.transactions.length
    } while (result.transactions.length < result.total_transactions)

    return result
  }

  syncTransactions(request: TransactionsSyncRequest): Promise<TransactionsSyncResponse> {
    return this.request('/transactions/sync', request, 'transactions.sync')
  }

  refreshTransactions(request: TransactionsRefreshRequest): Promise<{ request_id: string }> {
    return this.request('/transactions/refresh', request, 'transactions.refresh')
  }

  async syncAllTransactions(
    request: TransactionsSyncRequest,
    options: { maxPaginationRestarts?: number } = {},
  ): Promise<TransactionsSyncResult> {
    const initialCursor = request.cursor
    const maxRestarts = options.maxPaginationRestarts ?? 2

    for (let restart = 0; restart <= maxRestarts; restart += 1) {
      let cursor = initialCursor
      const result: TransactionsSyncResult = {
        accounts: [],
        added: [],
        modified: [],
        next_cursor: initialCursor ?? '',
        removed: [],
        request_ids: [],
      }

      try {
        let hasMore = true
        while (hasMore) {
          const page = await this.syncTransactions({
            ...request,
            ...(cursor === undefined ? {} : { cursor }),
          })
          result.accounts = page.accounts
          result.added.push(...page.added)
          result.modified.push(...page.modified)
          result.removed.push(...page.removed)
          result.next_cursor = page.next_cursor
          result.request_ids.push(page.request_id)
          if (page.transactions_update_status !== undefined) {
            result.transactions_update_status = page.transactions_update_status
          }
          cursor = page.next_cursor
          hasMore = page.has_more
        }
        return result
      } catch (error) {
        if (
          restart < maxRestarts &&
          error instanceof PlaidApiError &&
          error.errorCode === mutationDuringPaginationCode
        ) {
          continue
        }
        throw error
      }
    }

    throw new Error('Plaid transaction synchronization restart limit was exceeded.')
  }

  getIdentity(request: IdentityGetRequest): Promise<IdentityGetResponse> {
    return this.request('/identity/get', request, 'identity.get')
  }

  getRecurringTransactions(
    request: TransactionsRecurringGetRequest,
  ): Promise<TransactionsRecurringGetResponse> {
    return this.request('/transactions/recurring/get', request, 'transactions.getRecurring')
  }

  getLiabilities(request: LiabilitiesGetRequest): Promise<LiabilitiesGetResponse> {
    return this.request('/liabilities/get', request, 'liabilities.get')
  }

  getInvestmentHoldings(
    request: InvestmentsHoldingsGetRequest,
  ): Promise<InvestmentsHoldingsGetResponse> {
    return this.request('/investments/holdings/get', request, 'investments.getHoldings')
  }

  getInvestmentTransactions(
    request: InvestmentsTransactionsGetRequest,
  ): Promise<InvestmentsTransactionsGetResponse> {
    return this.request('/investments/transactions/get', request, 'investments.getTransactions')
  }

  async getAllInvestmentTransactions(
    request: InvestmentsTransactionsGetRequest,
  ): Promise<InvestmentsTransactionsGetAllResult> {
    const count = request.options?.count ?? 500
    let offset = request.options?.offset ?? 0
    const result: InvestmentsTransactionsGetAllResult = {
      accounts: [],
      investment_transactions: [],
      item: {
        available_products: [],
        billed_products: [],
        error: null,
        institution_id: null,
        item_id: '',
        products: [],
        update_type: 'background',
        webhook: '',
      },
      request_ids: [],
      securities: [],
      total_investment_transactions: 0,
    }

    do {
      const page = await this.getInvestmentTransactions({
        ...request,
        options: {
          ...request.options,
          count,
          offset,
        },
      })
      result.accounts = page.accounts
      result.item = page.item
      result.securities = page.securities
      result.total_investment_transactions = page.total_investment_transactions
      result.investment_transactions.push(...page.investment_transactions)
      result.request_ids.push(page.request_id)
      if (page.investment_transactions.length === 0) {
        break
      }
      offset += page.investment_transactions.length
    } while (result.investment_transactions.length < result.total_investment_transactions)

    return result
  }

  refreshInvestments(request: InvestmentsRefreshRequest): Promise<{ request_id: string }> {
    return this.request('/investments/refresh', request, 'investments.refresh')
  }

  enrichTransactions(request: TransactionsEnrichRequest): Promise<TransactionsEnrichResponse> {
    return this.request('/transactions/enrich', request, 'transactions.enrich')
  }

  listStatements(request: StatementsListRequest): Promise<StatementsListResponse> {
    return this.request('/statements/list', request, 'statements.list')
  }

  downloadStatement(request: StatementsDownloadRequest): Promise<PlaidBinaryResponse> {
    return this.requestBinary('/statements/download', request, 'statements.download')
  }

  refreshStatements(request: StatementsRefreshRequest): Promise<{ request_id: string }> {
    return this.request('/statements/refresh', request, 'statements.refresh')
  }

  createAssetReport(request: AssetReportCreateRequest): Promise<AssetReportTokenResponse> {
    return this.request('/asset_report/create', request, 'assets.createReport')
  }

  getAssetReport(request: AssetReportGetRequest): Promise<AssetReportGetResponse> {
    return this.request('/asset_report/get', request, 'assets.getReport')
  }

  downloadAssetReportPdf(request: AssetReportPdfGetRequest): Promise<PlaidBinaryResponse> {
    return this.requestBinary('/asset_report/pdf/get', request, 'assets.downloadReportPdf')
  }

  refreshAssetReport(request: AssetReportRefreshRequest): Promise<AssetReportTokenResponse> {
    return this.request('/asset_report/refresh', request, 'assets.refreshReport')
  }

  filterAssetReport(request: AssetReportFilterRequest): Promise<AssetReportTokenResponse> {
    return this.request('/asset_report/filter', request, 'assets.filterReport')
  }

  removeAssetReport(request: AssetReportRemoveRequest): Promise<AssetReportRemoveResponse> {
    return this.request('/asset_report/remove', request, 'assets.removeReport')
  }

  createAssetReportAuditCopy(
    request: AssetReportAuditCopyCreateRequest,
  ): Promise<AssetReportAuditCopyCreateResponse> {
    return this.request('/asset_report/audit_copy/create', request, 'assets.createAuditCopy')
  }

  removeAssetReportAuditCopy(
    request: AssetReportAuditCopyRemoveRequest,
  ): Promise<AssetReportAuditCopyRemoveResponse> {
    return this.request('/asset_report/audit_copy/remove', request, 'assets.removeAuditCopy')
  }

  getInstitutionById(request: InstitutionGetByIdRequest): Promise<InstitutionGetByIdResponse> {
    return this.request('/institutions/get_by_id', request, 'institutions.get')
  }

  searchInstitutions(request: InstitutionSearchRequest): Promise<InstitutionSearchResponse> {
    return this.request('/institutions/search', request, 'institutions.search')
  }

  getWebhookVerificationKey(
    request: WebhookVerificationKeyGetRequest,
  ): Promise<WebhookVerificationKeyGetResponse> {
    return this.request('/webhook_verification_key/get', request, 'webhooks.getVerificationKey')
  }

  verifyWebhook(body: string | Uint8Array, signedJwt: string): Promise<PlaidWebhook> {
    return verifyPlaidWebhook(body, signedJwt, {
      getVerificationKey: async (keyId) =>
        (await this.getWebhookVerificationKey({ key_id: keyId })).key,
    })
  }

  async request<TResponse>(
    path: string,
    body: PlaidRecord | object,
    operation = 'request',
  ): Promise<TResponse> {
    try {
      return await this.#transport.request<TResponse>({
        init: {
          body: JSON.stringify(body),
          method: 'POST',
        },
        operation,
        path,
      })
    } catch (error) {
      if (error instanceof ProviderApiError && isPlaidErrorBody(error.body)) {
        throw new PlaidApiError(error.body, error.status, operation)
      }
      throw error
    }
  }

  async requestBinary(
    path: string,
    body: PlaidRecord | object,
    operation = 'requestBinary',
  ): Promise<PlaidBinaryResponse> {
    try {
      const response = await this.#transport.request<Uint8Array>({
        init: {
          body: JSON.stringify(body),
          method: 'POST',
        },
        operation,
        parse: async (raw) => new Uint8Array(await raw.arrayBuffer()),
        path,
        response: 'full',
      })

      const contentHash = response.raw.headers.get('plaid-content-hash')
      const contentType = response.raw.headers.get('content-type')
      const requestId =
        response.raw.headers.get('plaid-request-id') ??
        response.raw.headers.get('request-id') ??
        response.metadata.requestId

      return {
        data: response.data,
        ...(contentHash === null ? {} : { contentHash }),
        ...(contentType === null ? {} : { contentType }),
        ...(requestId === undefined ? {} : { requestId }),
      }
    } catch (error) {
      if (error instanceof ProviderApiError && isPlaidErrorBody(error.body)) {
        throw new PlaidApiError(error.body, error.status, operation)
      }
      throw error
    }
  }
}

function isPlaidErrorBody(value: unknown): value is PlaidApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('error_code' in value || 'error_message' in value || 'error_type' in value)
  )
}
