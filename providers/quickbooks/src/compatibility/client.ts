// SPDX-License-Identifier: Apache-2.0

import { ProviderApiError, ValidationError } from '@ottoai/zuno'
import type { QuickBooksClient } from '../client.js'
import {
  contactToQuickBooks,
  decodeContactId,
  mapAccount,
  mapCategory,
  mapContact,
  mapGeneralLedgerTransactionIdsByAccount,
  mapNativeTransaction,
  mapReport,
  mapTransactionReport,
} from './qbo-mapper/index.js'
import type {
  AccountQueryParams,
  AccountingAccount,
  AccountingCategory,
  AccountingContact,
  AccountingReport,
  AccountingTransaction,
  CategoryQueryParams,
  ContactQueryParams,
  ReportQueryParams,
  ReportSummarizeBy,
  TransactionQueryParams,
} from './types.js'

const defaultPageSize = 1_000
const defaultTransactionQueryConcurrency = 2
const transactionEntities = [
  'Purchase',
  'Deposit',
  'Transfer',
  'CreditCardPayment',
  'Payment',
  'Bill',
  'BillPayment',
  'Invoice',
  'SalesReceipt',
  'RefundReceipt',
  'VendorCredit',
  'CreditMemo',
  'JournalEntry',
] as const

export interface QuickBooksAccountingLogger {
  error?: (context: unknown, message: string) => void
  info?: (context: unknown, message: string) => void
}

export interface QuickBooksAccountingClientOptions {
  logger?: QuickBooksAccountingLogger
  transactionQueryConcurrency?: number
}

export class QuickBooksAccountingClient {
  readonly #client: QuickBooksClient
  readonly #logger: QuickBooksAccountingLogger
  readonly #transactionQueryConcurrency: number

  constructor(client: QuickBooksClient, options: QuickBooksAccountingClientOptions = {}) {
    this.#client = client
    this.#logger = options.logger ?? {}
    this.#transactionQueryConcurrency = Math.max(
      1,
      options.transactionQueryConcurrency ?? defaultTransactionQueryConcurrency,
    )
  }

  getCompanyInfo() {
    return this.#client.getCompanyInfo()
  }

  async listAccounts(params: AccountQueryParams = {}): Promise<AccountingAccount[]> {
    const accounts = await this.#queryAll('Account', {
      ...params,
      query: includeInactiveQuery(params.query),
    })

    return accounts.map(mapAccount).sort((left, right) => {
      const field = params.sort === 'name' ? 'name' : 'updatedAt'
      const leftValue = left[field]
      const rightValue = right[field]
      const result =
        leftValue instanceof Date && rightValue instanceof Date
          ? leftValue.getTime() - rightValue.getTime()
          : String(leftValue ?? '').localeCompare(String(rightValue ?? ''))
      return params.order === 'asc' ? result : -result
    })
  }

  async getAccount(id: string): Promise<AccountingAccount> {
    const [account] = await this.#queryAll('Account', {
      query: `Id = '${escapeQueryValue(id)}'`,
    })

    if (!account) {
      throw notFound('Account not found.', 'accounts.get')
    }

    return mapAccount(account)
  }

  async listContacts(params: ContactQueryParams = {}): Promise<AccountingContact[]> {
    const types = params.type ? [params.type] : (['CUSTOMER', 'SUPPLIER'] as const)
    const queryParams: AccountQueryParams = {
      query: includeInactiveQuery(params.query),
      ...(params.updatedGte === undefined ? {} : { updatedGte: params.updatedGte }),
    }
    const contacts = await Promise.all(
      types.map(async (type) => {
        const entity = type === 'CUSTOMER' ? 'Customer' : 'Vendor'
        const rows = await this.#queryAll(entity, queryParams)
        return rows.map((row) => mapContact(row, type))
      }),
    )
    const filtered = contacts
      .flat()
      .filter((contact) => !params.orgId || contact.organizationId === params.orgId)
    const offset = params.offset ?? 0
    return filtered.slice(offset, offset + (params.limit ?? filtered.length))
  }

  async getContact(id: string): Promise<AccountingContact> {
    const decoded = decodeContactId(id)
    const types = decoded.type ? [decoded.type] : (['CUSTOMER', 'SUPPLIER'] as const)

    for (const type of types) {
      const entity = type === 'CUSTOMER' ? 'Customer' : 'Vendor'
      const rows = await this.#queryAll(entity, {
        query: `Id = '${escapeQueryValue(decoded.id)}'`,
      })

      if (rows[0]) {
        return mapContact(rows[0], type)
      }
    }

    throw notFound('Contact not found.', 'contacts.get')
  }

  async createContact(contact: AccountingContact): Promise<AccountingContact> {
    const isSupplier = contact.isSupplier === true && contact.isCustomer !== true
    const entity = isSupplier ? 'vendor' : 'customer'
    const type = isSupplier ? 'SUPPLIER' : 'CUSTOMER'
    const payload = await this.#client.request<Record<string, any>>(
      this.#client.withMinorVersion(this.#client.companyPath(entity)),
      {
        body: JSON.stringify(contactToQuickBooks(contact)),
        method: 'POST',
      },
      'contacts.create',
    )
    const result = payload[capitalize(entity)]

    if (!result) {
      throw invalidResponse('QuickBooks did not return the created contact.', 'contacts.create')
    }

    return mapContact(result, type)
  }

  async patchContact(id: string, contact: AccountingContact): Promise<AccountingContact> {
    const decoded = decodeContactId(id)
    const existing = await this.getContact(id)
    const entity =
      existing.isSupplier === true && existing.isCustomer !== true ? 'vendor' : 'customer'
    const type = entity === 'vendor' ? 'SUPPLIER' : 'CUSTOMER'
    const payload = await this.#client.request<Record<string, any>>(
      this.#client.withMinorVersion(`${this.#client.companyPath(entity)}?operation=update`),
      {
        body: JSON.stringify({
          ...contactToQuickBooks(contact),
          Id: decoded.id,
          SyncToken: existing.raw?.SyncToken,
          sparse: true,
        }),
        method: 'POST',
      },
      'contacts.update',
    )
    const result = payload[capitalize(entity)]

    if (!result) {
      throw invalidResponse('QuickBooks did not return the updated contact.', 'contacts.update')
    }

    return mapContact(result, type)
  }

  async listCategories(params: CategoryQueryParams = {}): Promise<AccountingCategory[]> {
    const queryParams: AccountQueryParams = {
      query: includeInactiveQuery(params.query),
      ...(params.updatedGte === undefined ? {} : { updatedGte: params.updatedGte }),
    }
    const results = await Promise.allSettled([
      this.#queryAll('Class', queryParams),
      this.#queryAll('Department', queryParams),
    ])
    const filtered = results
      .flatMap((result, index) =>
        result.status === 'fulfilled'
          ? result.value.map((row) => mapCategory(row, index === 0 ? 'CLASS' : 'DEPARTMENT'))
          : [],
      )
      .filter((category) => !params.parentId || category.parentId === params.parentId)
    const offset = params.offset ?? 0
    return filtered.slice(offset, offset + (params.limit ?? filtered.length))
  }

  async getCategory(id: string): Promise<AccountingCategory> {
    const categories = await this.listCategories({
      query: `Id = '${escapeQueryValue(id)}'`,
    })
    const category = categories[0]

    if (!category) {
      throw notFound('Category not found.', 'categories.get')
    }

    return category
  }

  async listTransactions(params: TransactionQueryParams = {}): Promise<AccountingTransaction[]> {
    const query = [
      params.startGte
        ? `TxnDate >= '${escapeQueryValue(params.startGte.slice(0, 10))}'`
        : undefined,
      params.endLt ? `TxnDate < '${escapeQueryValue(params.endLt.slice(0, 10))}'` : undefined,
      params.query,
    ]
      .filter(Boolean)
      .join(' AND ')
    const queryParams: AccountQueryParams = {
      ...(query ? { query } : {}),
      ...(params.updatedGte === undefined ? {} : { updatedGte: params.updatedGte }),
    }
    const [items, accounts] = await Promise.all([
      this.#queryAll('Item', {}),
      this.#queryAll('Account', {}),
    ])
    const entityRows: Array<Array<Record<string, any>>> = []

    for (
      let index = 0;
      index < transactionEntities.length;
      index += this.#transactionQueryConcurrency
    ) {
      const entities = transactionEntities.slice(index, index + this.#transactionQueryConcurrency)
      const rows = await Promise.all(
        entities.map(async (entity) => {
          try {
            return await this.#queryAll(entity, queryParams)
          } catch (error) {
            this.#logger.error?.({ entity, error }, 'QuickBooks transaction entity query failed.')
            throw error
          }
        }),
      )
      entityRows.push(...rows)
    }

    const itemAccounts = new Map(
      items.map((item) => [
        String(item.Id),
        {
          ...(item.ExpenseAccountRef?.value
            ? { expenseAccountId: String(item.ExpenseAccountRef.value) }
            : {}),
          ...(item.IncomeAccountRef?.value
            ? { incomeAccountId: String(item.IncomeAccountRef.value) }
            : {}),
        },
      ]),
    )
    const transactions = entityRows.flatMap((rows, index) =>
      rows.flatMap((transaction) =>
        mapNativeTransaction(transactionEntities[index] ?? '', transaction, itemAccounts),
      ),
    )
    const generalLedger = await this.#client.request<Record<string, any>>(
      this.#reportPath('GeneralLedger', {
        end_date: previousDate(params.endLt),
        start_date: dateOnly(params.startGte ?? params.updatedGte),
      }),
      {},
      'transactions.generalLedger',
    )
    const accountIdsByName = new Map(
      accounts.map((account) => [String(account.Name), String(account.Id)]),
    )
    const accountTypesById = new Map(
      accounts.map((account) => [String(account.Id), String(account.AccountType ?? '')]),
    )
    const reportTransactions = mapTransactionReport(
      generalLedger,
      accountIdsByName,
      accountTypesById,
    )
    const reportTypes = new Map(
      reportTransactions.flatMap((transaction) => {
        const id = transactionId(transaction)
        return id && transaction.type ? [[id, transaction.type]] : []
      }),
    )

    for (const transaction of transactions) {
      const id = transactionId(transaction)

      const reportType = id ? reportTypes.get(id) : undefined

      if (reportType) {
        transaction.type = reportType
      }
    }

    const nativeIds = new Set(
      transactions.map(transactionId).filter((id): id is string => Boolean(id)),
    )
    const reportFallback = [
      ...new Map(
        reportTransactions
          .filter((transaction) => {
            const id = transactionId(transaction)
            return id ? !nativeIds.has(id) : false
          })
          .map((transaction) => [transaction.id, transaction]),
      ).values(),
    ]
    transactions.push(...reportFallback)

    const filteredTransactions = transactions.filter(
      (transaction) =>
        (!params.contactId ||
          transaction.contacts?.some((contact) => contact.id === params.contactId)) &&
        (!params.accountId ||
          transaction.accountId === params.accountId ||
          transaction.splitAccountId === params.accountId),
    )
    filteredTransactions.sort((left, right) => {
      const result =
        params.sort === 'id'
          ? String(transactionId(left) ?? '').localeCompare(
              String(transactionId(right) ?? ''),
              undefined,
              { numeric: true },
            )
          : params.sort === 'created_at'
            ? (left.createdAt?.getTime() ?? 0) - (right.createdAt?.getTime() ?? 0)
            : params.sort === 'updated_at'
              ? (left.updatedAt?.getTime() ?? 0) - (right.updatedAt?.getTime() ?? 0)
              : (left.transactionAt?.getTime() ?? 0) - (right.transactionAt?.getTime() ?? 0)
      return params.order === 'desc' ? -result : result
    })
    this.#logger.info?.(
      {
        entities: Object.fromEntries(
          transactionEntities.map((entity, index) => [entity, entityRows[index]?.length ?? 0]),
        ),
        mappedTransactions: filteredTransactions.length,
        reportFallbackTransactions: reportFallback.length,
      },
      'QuickBooks native transactions mapped.',
    )
    const offset = params.offset ?? 0
    const limit = params.limit ?? filteredTransactions.length
    return filteredTransactions.slice(offset, offset + limit)
  }

  async getTransaction(id: string): Promise<AccountingTransaction> {
    const transactions = await this.listTransactions({ limit: 10_000 })
    const transaction = transactions.find((item) => item.id === id)

    if (!transaction) {
      throw notFound('Transaction not found.', 'transactions.get')
    }

    return transaction
  }

  async listDeletedTransactionIds(changedSince: string): Promise<string[]> {
    const query = new URLSearchParams({
      changedSince,
      entities: transactionEntities.filter((entity) => entity !== 'CreditCardPayment').join(','),
      minorversion: this.#client.minorVersion,
    })
    const payload = await this.#client.request<Record<string, unknown>>(
      `${this.#client.companyPath('cdc')}?${query}`,
      { headers: { 'Content-Type': 'text/plain' } },
      'transactions.deleted',
    )
    return [...collectDeletedTransactionIds(payload)]
  }

  listProfitLoss(params: ReportQueryParams = {}) {
    return this.#listReport('ProfitAndLoss', params)
  }

  listBalanceSheet(params: ReportQueryParams = {}) {
    return this.#listReport('BalanceSheet', params)
  }

  listCashFlow(params: ReportQueryParams = {}) {
    return this.#listReport('CashFlow', params)
  }

  listTrialBalance(params: ReportQueryParams = {}) {
    return this.#listReport('TrialBalance', params)
  }

  async getProfitLoss(id: string) {
    return this.#getReportById(await this.listProfitLoss(), id)
  }

  async getBalanceSheet(id: string) {
    return this.#getReportById(await this.listBalanceSheet(), id)
  }

  async getCashFlow(id: string) {
    return this.#getReportById(await this.listCashFlow(), id)
  }

  listGroupedProfitLoss(
    startGte: string,
    endLt: string,
    groupBy: ReportSummarizeBy,
    accountingMethod?: 'Accrual' | 'Cash',
  ) {
    return this.#groupedReport('ProfitAndLoss', startGte, endLt, groupBy, accountingMethod)
  }

  listGroupedBalanceSheet(
    startGte: string,
    endLt: string,
    groupBy: ReportSummarizeBy,
    accountingMethod?: 'Accrual' | 'Cash',
  ) {
    return this.#groupedReport('BalanceSheet', startGte, endLt, groupBy, accountingMethod)
  }

  listGroupedCashFlow(
    startGte: string,
    endLt: string,
    groupBy: ReportSummarizeBy,
    accountingMethod?: 'Accrual' | 'Cash',
  ) {
    return this.#groupedReport('CashFlow', startGte, endLt, groupBy, accountingMethod)
  }

  async #queryAll(entity: string, params: AccountQueryParams): Promise<Array<Record<string, any>>> {
    const pageSize = Math.min(params.limit ?? defaultPageSize, defaultPageSize)
    let startPosition = (params.offset ?? 0) + 1
    const rows: Array<Record<string, any>> = []

    while (true) {
      const where = [
        params.updatedGte
          ? `MetaData.LastUpdatedTime >= '${escapeQueryValue(params.updatedGte)}'`
          : undefined,
        params.query,
      ].filter(Boolean)
      const statement = `SELECT * FROM ${entity}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} STARTPOSITION ${startPosition} MAXRESULTS ${pageSize}`
      const payload = await this.#client.request<Record<string, any>>(
        this.#client.withMinorVersion(
          `${this.#client.companyPath('query')}?query=${encodeURIComponent(statement)}`,
        ),
        {},
        `${entity.toLowerCase()}.list`,
      )
      const page = (payload.QueryResponse?.[entity] ?? []) as Array<Record<string, any>>
      rows.push(...page)

      if (page.length < pageSize || (params.limit !== undefined && rows.length >= params.limit)) {
        break
      }

      startPosition += page.length
    }

    return params.limit === undefined ? rows : rows.slice(0, params.limit)
  }

  async #listReport(name: string, params: ReportQueryParams): Promise<AccountingReport[]> {
    const dates = reportDates(params)
    const [report, generalLedger] = await Promise.all([
      this.#client.request<Record<string, any>>(
        this.#reportPath(name, dates),
        {},
        `reports.${name}`,
      ),
      name === 'ProfitAndLoss' || name === 'CashFlow'
        ? this.#client.request<Record<string, any>>(
            this.#reportPath('GeneralLedger', dates),
            {},
            'reports.generalLedger',
          )
        : Promise.resolve(undefined),
    ])
    const transactionIdsByAccount = generalLedger
      ? mapGeneralLedgerTransactionIdsByAccount(generalLedger)
      : undefined

    return [mapReport(name, report, transactionIdsByAccount)].slice(
      params.offset ?? 0,
      (params.offset ?? 0) + (params.limit ?? 1),
    )
  }

  async #groupedReport(
    name: string,
    startGte: string,
    endLt: string,
    groupBy: ReportSummarizeBy,
    accountingMethod?: 'Accrual' | 'Cash',
  ): Promise<Record<string, any>> {
    const startDate = startGte.slice(0, 10)
    const endDate = previousDate(endLt)

    if (!endDate || endDate < startDate) {
      throw new ValidationError('endLt must be after startGte.', {
        operation: `reports.${name}.grouped`,
        provider: 'quickbooks',
      })
    }

    return this.#client.request<Record<string, any>>(
      this.#reportPath(name, {
        accounting_method: accountingMethod,
        end_date: endDate,
        start_date: startDate,
        summarize_column_by: {
          month: 'Month',
          quarter: 'Quarter',
          total: 'Total',
          year: 'Year',
        }[groupBy],
      }),
      {},
      `reports.${name}.grouped`,
    )
  }

  #getReportById(reports: AccountingReport[], id: string): AccountingReport {
    const report = reports.find((candidate) => candidate.id === id)

    if (!report) {
      throw notFound('Report not found.', 'reports.get')
    }

    return report
  }

  #reportPath(report: string, params: Record<string, string | undefined>): string {
    const query = new URLSearchParams()

    for (const [key, value] of Object.entries(params)) {
      if (value) {
        query.set(key, value)
      }
    }

    query.set('minorversion', this.#client.minorVersion)
    return `${this.#client.companyPath(`reports/${report}`)}?${query}`
  }
}

export function collectDeletedTransactionIds(
  value: unknown,
  result = new Set<string>(),
): Set<string> {
  if (Array.isArray(value)) {
    value.forEach((item) => collectDeletedTransactionIds(item, result))
    return result
  }

  if (!value || typeof value !== 'object') {
    return result
  }

  const record = value as Record<string, unknown>

  if (
    String(record.status ?? record.Status ?? '').toLowerCase() === 'deleted' &&
    (record.Id || record.id)
  ) {
    result.add(String(record.Id ?? record.id))
  }

  Object.values(record).forEach((item) => collectDeletedTransactionIds(item, result))
  return result
}

function escapeQueryValue(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")
}

function includeInactiveQuery(query?: string): string {
  return [query, 'Active IN (true, false)'].filter(Boolean).join(' AND ')
}

function previousDate(value?: string): string | undefined {
  if (!value) {
    return undefined
  }

  const result = new Date(`${value.slice(0, 10)}T00:00:00.000Z`)
  result.setUTCDate(result.getUTCDate() - 1)
  return result.toISOString().slice(0, 10)
}

function dateOnly(value?: string): string | undefined {
  return value?.slice(0, 10)
}

function reportDates(params: ReportQueryParams): {
  end_date?: string
  start_date?: string
} {
  if (!params.startGte && !params.endLt && !params.updatedGte) {
    return {
      end_date: new Date().toISOString().slice(0, 10),
      start_date: '1900-01-01',
    }
  }

  const endDate = params.endLt?.slice(0, 10)
  const startDate = (params.startGte ?? params.updatedGte)?.slice(0, 10)

  return {
    ...(endDate === undefined ? {} : { end_date: endDate }),
    ...(startDate === undefined ? {} : { start_date: startDate }),
  }
}

function transactionId(transaction: AccountingTransaction): string | undefined {
  if (!transaction.id) {
    return undefined
  }

  try {
    return String(JSON.parse(Buffer.from(transaction.id, 'base64').toString('utf8')).id)
  } catch {
    return undefined
  }
}

function capitalize(value: string): string {
  return `${value[0]?.toUpperCase() ?? ''}${value.slice(1)}`
}

function notFound(message: string, operation: string): ProviderApiError {
  return new ProviderApiError(message, {
    operation,
    provider: 'quickbooks',
    status: 404,
  })
}

function invalidResponse(message: string, operation: string): ProviderApiError {
  return new ProviderApiError(message, {
    operation,
    provider: 'quickbooks',
    status: 502,
  })
}
