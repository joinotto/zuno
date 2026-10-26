// SPDX-License-Identifier: Apache-2.0

import { ProviderApiError, ValidationError } from '@ottoai/zuno'
import { describe, expect, it } from 'vitest'
import { QuickBooksClient } from '../src/client.js'
import {
  collectDeletedTransactionIds,
  QuickBooksAccountingClient,
} from '../src/compatibility/client.js'

describe('QuickBooksAccountingClient', () => {
  it('lists and mutates accounts, contacts, and categories', async () => {
    const requests: Request[] = []
    const accounting = createAccountingClient(requests)

    await expect(accounting.getCompanyInfo()).resolves.toMatchObject({
      id: 'realm-1',
      name: 'Zuno Test Company',
    })
    await expect(accounting.listAccounts({ order: 'asc', sort: 'name' })).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'bank-1', name: 'Checking', type: 'BANK' }),
        expect.objectContaining({
          id: 'expense-1',
          name: 'Software Expense',
          type: 'EXPENSE',
        }),
      ]),
    )
    await expect(accounting.getAccount('bank-1')).resolves.toMatchObject({
      id: 'bank-1',
    })

    const contacts = await accounting.listContacts({ limit: 10, offset: 0 })
    expect(contacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ isCustomer: true, name: 'Customer' }),
        expect.objectContaining({ isSupplier: true, name: 'Vendor' }),
      ]),
    )
    const vendor = contacts.find((contact) => contact.isSupplier)
    await expect(accounting.getContact(vendor?.id ?? '')).resolves.toMatchObject({
      name: 'Vendor',
    })
    await expect(
      accounting.createContact({
        companyName: 'Created Vendor',
        isSupplier: true,
        name: 'Created Vendor',
      }),
    ).resolves.toMatchObject({
      isSupplier: true,
      name: 'Created Vendor',
    })
    await expect(
      accounting.patchContact(vendor?.id ?? '', {
        companyName: 'Updated Vendor',
        isSupplier: true,
        name: 'Updated Vendor',
      }),
    ).resolves.toMatchObject({
      isSupplier: true,
      name: 'Updated Vendor',
    })

    await expect(accounting.listCategories()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'class-1', type: 'CLASS' }),
        expect.objectContaining({ id: 'department-1', type: 'DEPARTMENT' }),
      ]),
    )
    await expect(accounting.getCategory('class-1')).resolves.toMatchObject({
      id: 'class-1',
    })

    expect(
      requests.some(
        (request) =>
          request.method === 'POST' &&
          request.url.includes('/vendor') &&
          request.url.includes('minorversion=75'),
      ),
    ).toBe(true)
  })

  it('returns all report families and grouped provider reports', async () => {
    const accounting = createAccountingClient([])
    const range = {
      endLt: '2026-12-31',
      startGte: '2026-01-01',
    }

    const profitLoss = await accounting.listProfitLoss(range)
    const balanceSheet = await accounting.listBalanceSheet(range)
    const cashFlow = await accounting.listCashFlow(range)
    const trialBalance = await accounting.listTrialBalance(range)

    expect(profitLoss[0]).toMatchObject({
      incomeTotalAmount: 100,
      netIncomeAmount: 75,
    })
    expect(balanceSheet[0]).toMatchObject({ netAssetsAmount: 100 })
    expect(cashFlow[0]).toMatchObject({
      cashBeginningAmount: 100,
      cashEndingAmount: 125,
      netChangeInCashAmount: 25,
    })
    expect(trialBalance[0]).toMatchObject({
      totalCreditAmount: 100,
      totalDebitAmount: 100,
    })

    await expect(accounting.getProfitLoss(profitLoss[0]?.id ?? '')).resolves.toMatchObject({
      name: 'ProfitAndLoss',
    })
    await expect(accounting.getBalanceSheet(balanceSheet[0]?.id ?? '')).resolves.toMatchObject({
      name: 'BalanceSheet',
    })
    await expect(accounting.getCashFlow(cashFlow[0]?.id ?? '')).resolves.toMatchObject({
      name: 'CashFlow',
    })
    await expect(
      accounting.listGroupedProfitLoss('2026-01-01', '2026-04-01', 'month', 'Accrual'),
    ).resolves.toMatchObject({
      Header: { ReportName: 'ProfitAndLoss' },
    })
    await expect(
      accounting.listGroupedBalanceSheet('2026-01-01', '2026-04-01', 'quarter'),
    ).resolves.toMatchObject({
      Header: { ReportName: 'BalanceSheet' },
    })
    await expect(
      accounting.listGroupedCashFlow('2026-01-01', '2026-04-01', 'year', 'Cash'),
    ).resolves.toMatchObject({
      Header: { ReportName: 'CashFlow' },
    })
    await expect(
      accounting.listGroupedCashFlow('2026-04-01', '2026-01-01', 'total'),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('lists, filters, sorts, retrieves, and deletes transactions', async () => {
    const logs: unknown[] = []
    const accounting = createAccountingClient([], {
      info: (context) => logs.push(context),
    })
    const transactions = await accounting.listTransactions({
      accountId: 'expense-1',
      endLt: '2026-11-01',
      limit: 10,
      order: 'desc',
      sort: 'id',
      startGte: '2026-10-01',
    })

    expect(transactions).toHaveLength(2)
    const expense = transactions.find((transaction) => transaction.accountId === 'expense-1')
    expect(expense).toMatchObject({
      accountId: 'expense-1',
      memo: 'Software',
      totalAmount: 50,
      type: 'Expense',
    })
    await expect(accounting.getTransaction(expense?.id ?? '')).resolves.toMatchObject({
      accountId: 'expense-1',
    })
    await expect(accounting.listDeletedTransactionIds('2026-10-01T00:00:00.000Z')).resolves.toEqual(
      ['deleted-1', 'deleted-2'],
    )
    expect(logs).toHaveLength(2)
  })

  it('maps not-found and invalid provider responses', async () => {
    const accounting = createAccountingClient([], undefined, {
      Account: [],
      Class: [],
      Customer: [],
      Department: [],
      Vendor: [],
    })

    await expect(accounting.getAccount('missing')).rejects.toBeInstanceOf(ProviderApiError)
    await expect(accounting.getContact('missing')).rejects.toBeInstanceOf(ProviderApiError)
    await expect(accounting.getCategory('missing')).rejects.toBeInstanceOf(ProviderApiError)
    await expect(accounting.getProfitLoss('missing')).rejects.toBeInstanceOf(ProviderApiError)
    await expect(accounting.getTransaction('missing')).rejects.toBeInstanceOf(ProviderApiError)
  })

  it('collects deleted IDs from nested CDC payloads', () => {
    expect([
      ...collectDeletedTransactionIds({
        CDCResponse: [
          {
            QueryResponse: [
              { Invoice: [{ Id: '10', status: 'Deleted' }] },
              { Purchase: [{ Id: '11', Status: 'Deleted' }] },
              { Transfer: [{ Id: '12', status: 'Active' }] },
            ],
          },
        ],
      }),
    ]).toEqual(['10', '11'])
    expect([...collectDeletedTransactionIds(null)]).toEqual([])
  })

  it('covers sorting, filtering, pagination, and all-time reports', async () => {
    const accounting = createAccountingClient([], undefined, {
      Account: [
        {
          AccountType: 'Bank',
          Id: 'newer',
          MetaData: { LastUpdatedTime: '2026-02-01T00:00:00.000Z' },
          Name: 'Newer',
        },
        {
          AccountType: 'Bank',
          Id: 'older',
          MetaData: { LastUpdatedTime: '2026-01-01T00:00:00.000Z' },
          Name: 'Older',
        },
      ],
      Customer: [{ DisplayName: 'Customer', Id: 'customer-1' }],
      Vendor: [],
    })

    await expect(accounting.listAccounts()).resolves.toMatchObject([
      { id: 'newer' },
      { id: 'older' },
    ])
    await expect(
      accounting.listContacts({
        limit: 1,
        offset: 1,
        orgId: 'missing-org',
        type: 'CUSTOMER',
        updatedGte: '2026-01-01T00:00:00.000Z',
      }),
    ).resolves.toEqual([])
    await expect(accounting.listProfitLoss({ limit: 0, offset: 1 })).resolves.toEqual([])
    await expect(
      accounting.listProfitLoss({ updatedGte: '2026-01-01T00:00:00.000Z' }),
    ).resolves.toHaveLength(1)
  })

  it('creates customers and rejects missing write responses', async () => {
    const accounting = createAccountingClient([])

    await expect(
      accounting.createContact({
        companyName: 'Created Customer',
        isCustomer: true,
        name: 'Created Customer',
      }),
    ).resolves.toMatchObject({
      isCustomer: true,
      name: 'Created Customer',
    })

    const customer = (await accounting.listContacts({ type: 'CUSTOMER' }))[0]
    await expect(
      accounting.patchContact(customer?.id ?? '', {
        companyName: 'Updated Customer',
        isCustomer: true,
        name: 'Updated Customer',
      }),
    ).resolves.toMatchObject({
      isCustomer: true,
      name: 'Updated Customer',
    })

    const invalid = createAccountingClient([], undefined, {}, (request) =>
      request.method === 'POST' ? Response.json({}) : undefined,
    )
    await expect(
      invalid.createContact({ isSupplier: true, name: 'Missing Vendor' }),
    ).rejects.toBeInstanceOf(ProviderApiError)
  })

  it('keeps available categories and logs failed transaction entities', async () => {
    const categoryClient = createAccountingClient([], undefined, {}, (request) => {
      const query = new URL(request.url).searchParams.get('query') ?? ''
      return query.includes('FROM Department')
        ? Response.json({ fault: 'unavailable' }, { status: 503 })
        : undefined
    })

    await expect(categoryClient.listCategories()).resolves.toEqual([
      expect.objectContaining({ id: 'class-1' }),
    ])

    const errors: unknown[] = []
    const transactionClient = createAccountingClient(
      [],
      {
        error: (context) => errors.push(context),
      },
      {},
      (request) => {
        const query = new URL(request.url).searchParams.get('query') ?? ''
        return /\bFROM Bill(?:\s|$)/u.test(query)
          ? Response.json({ fault: 'unavailable' }, { status: 503 })
          : undefined
      },
    )

    await expect(transactionClient.listTransactions()).rejects.toBeInstanceOf(ProviderApiError)
    expect(errors).toHaveLength(1)
  })

  it('uses General Ledger transactions when native entities are incomplete', async () => {
    const accounting = createAccountingClient([], undefined, {
      Purchase: [],
    })
    const supplierId = Buffer.from(JSON.stringify({ type: 'SUPPLIER', c_id: 'vendor-1' })).toString(
      'base64',
    )

    await expect(
      accounting.listTransactions({
        contactId: supplierId,
        order: 'desc',
        sort: 'created_at',
      }),
    ).resolves.toHaveLength(2)
    await expect(
      accounting.listTransactions({ order: 'desc', sort: 'updated_at' }),
    ).resolves.toHaveLength(2)
    await expect(
      accounting.listTransactions({ order: 'desc', sort: 'transaction_at' }),
    ).resolves.toHaveLength(2)
  })
})

function createAccountingClient(
  requests: Request[],
  logger?: {
    error?: (context: unknown, message: string) => void
    info?: (context: unknown, message: string) => void
  },
  queryOverrides: Record<string, Record<string, unknown>[]> = {},
  responseOverride?: (request: Request) => Response | undefined,
): QuickBooksAccountingClient {
  const queryData: Record<string, Record<string, unknown>[]> = {
    Account: [
      {
        AccountType: 'Bank',
        Active: true,
        Id: 'bank-1',
        Name: 'Checking',
      },
      {
        AccountType: 'Expense',
        Active: true,
        Id: 'expense-1',
        Name: 'Software Expense',
      },
    ],
    Bill: [],
    BillPayment: [],
    Class: [{ Active: true, Id: 'class-1', Name: 'Class' }],
    CreditCardPayment: [],
    CreditMemo: [],
    Customer: [{ Active: true, DisplayName: 'Customer', Id: 'customer-1' }],
    Department: [{ Active: true, Id: 'department-1', Name: 'Department' }],
    Deposit: [],
    Invoice: [],
    Item: [],
    JournalEntry: [],
    Payment: [],
    Purchase: [
      {
        AccountRef: { value: 'bank-1' },
        Id: 'purchase-1',
        Line: [
          {
            AccountBasedExpenseLineDetail: {
              AccountRef: { value: 'expense-1' },
            },
            Amount: 50,
          },
        ],
        PrivateNote: 'Software',
        TotalAmt: 50,
        TxnDate: '2026-10-01',
        VendorRef: { value: 'vendor-1' },
      },
    ],
    RefundReceipt: [],
    SalesReceipt: [],
    Transfer: [],
    Vendor: [
      {
        Active: true,
        DisplayName: 'Vendor',
        Id: 'vendor-1',
        SyncToken: '0',
      },
    ],
    VendorCredit: [],
    ...queryOverrides,
  }
  const client = new QuickBooksClient({
    environment: 'sandbox',
    fetch: async (input, init) => {
      const request = new Request(input, init)
      requests.push(request)
      const url = new URL(request.url)
      const overriddenResponse = responseOverride?.(request)

      if (overriddenResponse) {
        return overriddenResponse
      }

      if (url.pathname.includes('/companyinfo/')) {
        return Response.json({
          CompanyInfo: { CompanyName: 'Zuno Test Company', Id: 'realm-1' },
        })
      }

      if (url.pathname.endsWith('/query')) {
        const statement = url.searchParams.get('query') ?? ''
        const entity = /FROM ([A-Za-z]+)/u.exec(statement)?.[1] ?? ''
        const rows = queryData[entity] ?? []
        const id = /Id = '([^']+)'/u.exec(statement)?.[1]
        const filtered = id ? rows.filter((row) => scalarString(row.Id) === id) : rows
        return Response.json({ QueryResponse: { [entity]: filtered } })
      }

      if (url.pathname.endsWith('/vendor') && request.method === 'POST') {
        const body = (await request.json()) as Record<string, unknown>
        return Response.json({
          Vendor: {
            ...body,
            Id: 'created-vendor',
          },
        })
      }

      if (url.pathname.endsWith('/customer') && request.method === 'POST') {
        const body = (await request.json()) as Record<string, unknown>
        return Response.json({
          Customer: {
            ...body,
            Id: 'created-customer',
          },
        })
      }

      if (url.pathname.endsWith('/cdc')) {
        return Response.json({
          CDCResponse: [
            {
              QueryResponse: [
                { Purchase: [{ Id: 'deleted-1', status: 'Deleted' }] },
                { Invoice: [{ Id: 'deleted-2', Status: 'Deleted' }] },
              ],
            },
          ],
        })
      }

      if (url.pathname.includes('/reports/')) {
        const reportName = url.pathname.split('/').at(-1) ?? ''
        return Response.json(reportFixture(reportName))
      }

      return Response.json({ error: 'Not found' }, { status: 404 })
    },
    getAccessToken: async () => 'token',
    realmId: 'realm-1',
    retry: { maxAttempts: 1 },
  })

  return new QuickBooksAccountingClient(client, {
    ...(logger === undefined ? {} : { logger }),
    transactionQueryConcurrency: 4,
  })
}

function reportFixture(name: string): Record<string, unknown> {
  if (name === 'GeneralLedger') {
    return {
      Columns: {
        Column: [
          { ColTitle: 'Date' },
          { ColTitle: 'Transaction Type' },
          { ColTitle: 'Num' },
          { ColTitle: 'Name' },
          { ColTitle: 'Memo/Description' },
          { ColTitle: 'Account' },
          { ColTitle: 'Split' },
          { ColTitle: 'Amount' },
        ],
      },
      Rows: {
        Row: [
          {
            ColData: [
              { value: '2026-10-01' },
              { id: 'purchase-1', value: 'Expense' },
              { value: '1' },
              { id: 'vendor-1', value: 'Vendor' },
              { value: 'Software' },
              { id: 'bank-1', value: 'Checking' },
              { id: 'expense-1', value: 'Software Expense' },
              { value: '-50' },
            ],
          },
        ],
      },
    }
  }

  if (name === 'ProfitAndLoss') {
    return {
      Header: {
        Currency: 'USD',
        EndPeriod: '2026-12-31',
        ReportName: name,
        StartPeriod: '2026-01-01',
      },
      Rows: {
        Row: [
          {
            Header: { ColData: [{ value: 'Income' }, { value: '' }] },
            Rows: {
              Row: [
                {
                  ColData: [{ id: 'income-1', value: 'Sales' }, { value: '100' }],
                },
              ],
            },
            Summary: { ColData: [{ value: 'Total Income' }, { value: '100' }] },
            group: 'Income',
          },
          {
            Summary: { ColData: [{ value: 'Net Income' }, { value: '75' }] },
            group: 'NetIncome',
          },
        ],
      },
    }
  }

  if (name === 'BalanceSheet') {
    return {
      Header: { ReportName: name },
      Rows: {
        Row: [
          {
            Header: { ColData: [{ value: 'ASSETS' }] },
            Rows: { Row: [] },
            Summary: { ColData: [{ value: 'TOTAL ASSETS' }, { value: '100' }] },
            group: 'Assets',
          },
          {
            Header: { ColData: [{ value: 'LIABILITIES AND EQUITY' }] },
            Rows: { Row: [] },
            Summary: {
              ColData: [{ value: 'TOTAL LIABILITIES AND EQUITY' }, { value: '100' }],
            },
            group: 'LiabilitiesAndEquity',
          },
        ],
      },
    }
  }

  if (name === 'CashFlow') {
    return {
      Header: { ReportName: name },
      Rows: {
        Row: [
          {
            Summary: {
              ColData: [{ value: 'Cash at beginning' }, { value: '100' }],
            },
            group: 'BeginningCash',
          },
          {
            Summary: { ColData: [{ value: 'Cash at end' }, { value: '125' }] },
            group: 'EndingCash',
          },
        ],
      },
    }
  }

  return {
    Header: { ReportName: 'TrialBalance' },
    Rows: {
      GrandTotal: {
        ColData: [{ value: 'TOTAL' }, { value: '100' }, { value: '100' }],
      },
      Row: [],
    },
  }
}

function scalarString(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}
