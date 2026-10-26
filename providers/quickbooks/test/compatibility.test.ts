// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest'
import {
  contactToQuickBooks,
  decodeContactId,
  getTransactionReportDiagnostics,
  mapAccount,
  mapCategory,
  mapContact,
  mapGeneralLedgerTransactionIdsByAccount,
  mapNativeTransaction,
  mapReport,
  mapTransactionReport,
} from '../src/compatibility/index.js'

describe('QuickBooks compatibility mapping', () => {
  it('maps accounts and encoded contacts', () => {
    expect(
      mapAccount({
        AccountSubType: 'Checking',
        AccountType: 'Bank',
        Active: true,
        Id: '1',
        Name: 'Checking',
      }),
    ).toMatchObject({
      id: '1',
      name: 'Checking',
      status: 'ACTIVE',
      type: 'BANK',
    })

    const contact = mapContact(
      {
        Active: true,
        DisplayName: 'Vendor',
        Id: '65',
      },
      'SUPPLIER',
    )

    expect(decodeContactId(contact.id ?? '')).toEqual({
      id: '65',
      type: 'SUPPLIER',
    })
  })

  it('maps native purchases into balanced transaction legs', () => {
    const transactions = mapNativeTransaction('Purchase', {
      AccountRef: { value: 'bank-1' },
      Id: '4',
      Line: [
        {
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: 'expense-1' },
          },
          Amount: 25,
          Id: 'line-1',
        },
      ],
      TotalAmt: 25,
      TxnDate: '2026-10-22',
      VendorRef: { value: 'vendor-1' },
    })

    expect(transactions).toHaveLength(2)
    expect(transactions.map((transaction) => transaction.totalAmount)).toEqual([-25, 25])
    expect(transactions[0]).toMatchObject({
      accountId: 'bank-1',
      splitAccountId: 'expense-1',
      type: 'Expense',
    })
    expect(transactions[1]).toMatchObject({
      accountId: 'expense-1',
      splitAccountId: 'bank-1',
      type: 'Expense',
    })
  })

  it('maps report rows with correct credit and debit direction', () => {
    const transactions = mapTransactionReport(
      {
        Columns: {
          Column: [
            { ColTitle: 'Date' },
            { ColTitle: 'Transaction Type' },
            { ColTitle: 'Num' },
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
                { value: '2026-02-23' },
                { id: '2852', value: 'Expense' },
                { value: '' },
                { value: 'APPLECARD PAYMENT' },
                { id: 'bank-1', value: 'Checking' },
                { id: 'expense-1', value: 'Expense' },
                { value: '-455.86' },
              ],
            },
          ],
        },
      },
      new Map(),
    )

    expect(transactions.map((transaction) => transaction.totalAmount)).toEqual([-455.86, 455.86])
    expect(transactions[0]).toMatchObject({
      accountId: 'bank-1',
      memo: 'APPLECARD PAYMENT',
      splitAccountId: 'expense-1',
    })
  })

  it('attaches General Ledger transaction IDs to P&L account rows', () => {
    const transactionIdsByAccount = mapGeneralLedgerTransactionIdsByAccount({
      Columns: {
        Column: [{ ColTitle: 'Transaction Type' }, { ColTitle: 'Num' }, { ColTitle: 'Amount' }],
      },
      Rows: {
        Row: [
          {
            Header: { ColData: [{ id: '23', value: 'Utilities' }] },
            Rows: {
              Row: [
                {
                  ColData: [{ id: '2840', value: 'Expense' }, { value: '' }, { value: '40.00' }],
                },
              ],
            },
          },
        ],
      },
    })
    const report = mapReport(
      'ProfitAndLoss',
      {
        Header: {
          Currency: 'USD',
          EndPeriod: '2026-12-31',
          ReportName: 'ProfitAndLoss',
          StartPeriod: '2026-01-01',
        },
        Rows: {
          Row: [
            {
              Header: { ColData: [{ value: 'Expenses' }, { value: '' }] },
              Rows: {
                Row: [
                  {
                    ColData: [{ id: '23', value: 'Utilities' }, { value: '40.00' }],
                  },
                ],
              },
              Summary: {
                ColData: [{ value: 'Total Expenses' }, { value: '40.00' }],
              },
              group: 'Expenses',
            },
          ],
        },
      },
      transactionIdsByAccount,
    )

    expect(report.expensesSections?.[0]).toMatchObject({
      accounts: [
        {
          accountId: '23',
          accountName: 'Utilities',
          totalAmount: 40,
        },
      ],
      totalAmount: 40,
    })
    expect(report.expensesSections?.[0]?.accounts[0]?.transactionIds).toHaveLength(1)
  })

  it('keeps empty report sections out and preserves cash-flow groups', () => {
    const profitLoss = mapReport('ProfitAndLoss', {
      Header: { ReportName: 'ProfitAndLoss' },
      Rows: {
        Row: [
          {
            Header: { ColData: [{ value: 'Cost of Goods Sold' }, { value: '' }] },
            Rows: { Row: [] },
            Summary: {
              ColData: [{ value: 'Total Cost of Goods Sold' }, { value: '0' }],
            },
            group: 'CostOfGoodsSold',
          },
        ],
      },
    })
    const cashFlow = mapReport('CashFlow', {
      Header: { ReportName: 'CashFlow' },
      Rows: {
        Row: [
          {
            Header: { ColData: [{ value: 'INVESTING ACTIVITIES' }] },
            Rows: {
              Row: [
                {
                  ColData: [{ id: 'asset-1', value: 'Equipment' }, { value: '-100' }],
                },
              ],
            },
            Summary: {
              ColData: [{ value: 'Net cash from investing' }, { value: '-100' }],
            },
            group: 'InvestingActivities',
          },
        ],
      },
    })

    expect(profitLoss.costOfGoodsSoldSections).toEqual([])
    expect(cashFlow.investingSections?.[0]).toMatchObject({
      sectionName: 'Investing Activities',
      totalAmount: -100,
    })
  })

  it.each([
    [
      'Transfer',
      {
        Amount: 10,
        FromAccountRef: { value: 'bank-1' },
        Id: 'transfer-1',
        ToAccountRef: { value: 'bank-2' },
      },
      'bank-1',
      'bank-2',
      'Transfer',
    ],
    [
      'Payment',
      {
        ARAccountRef: { value: 'ar-1' },
        CustomerRef: { value: 'customer-1' },
        DepositToAccountRef: { value: 'bank-1' },
        Id: 'payment-1',
        TotalAmt: 10,
      },
      'ar-1',
      'bank-1',
      'Payment',
    ],
    [
      'Bill',
      {
        APAccountRef: { value: 'ap-1' },
        Id: 'bill-1',
        Line: [
          {
            AccountBasedExpenseLineDetail: {
              AccountRef: { value: 'expense-1' },
            },
            Amount: 10,
          },
        ],
        TotalAmt: 10,
      },
      'ap-1',
      'expense-1',
      'Bill',
    ],
    [
      'BillPayment',
      {
        APAccountRef: { value: 'ap-1' },
        CheckPayment: { BankAccountRef: { value: 'bank-1' } },
        Id: 'bill-payment-1',
        TotalAmt: 10,
      },
      'bank-1',
      'ap-1',
      'Bill Payment (Check)',
    ],
    [
      'Invoice',
      {
        ARAccountRef: { value: 'ar-1' },
        Id: 'invoice-1',
        Line: [
          {
            Amount: 10,
            SalesItemLineDetail: { ItemRef: { value: 'item-1' } },
          },
        ],
        TotalAmt: 10,
      },
      'income-1',
      'ar-1',
      'Invoice',
    ],
    [
      'SalesReceipt',
      {
        DepositToAccountRef: { value: 'bank-1' },
        Id: 'sales-receipt-1',
        Line: [
          {
            Amount: 10,
            SalesItemLineDetail: { ItemRef: { value: 'item-1' } },
          },
        ],
        TotalAmt: 10,
      },
      'income-1',
      'bank-1',
      'Sales Receipt',
    ],
    [
      'RefundReceipt',
      {
        DepositToAccountRef: { value: 'bank-1' },
        Id: 'refund-1',
        Line: [
          {
            Amount: 10,
            SalesItemLineDetail: { ItemRef: { value: 'item-1' } },
          },
        ],
        TotalAmt: 10,
      },
      'bank-1',
      'income-1',
      'Refund Receipt',
    ],
    [
      'VendorCredit',
      {
        APAccountRef: { value: 'ap-1' },
        Id: 'vendor-credit-1',
        Line: [
          {
            AccountBasedExpenseLineDetail: {
              AccountRef: { value: 'expense-1' },
            },
            Amount: 10,
          },
        ],
        TotalAmt: 10,
      },
      'expense-1',
      'ap-1',
      'Vendor Credit',
    ],
    [
      'CreditMemo',
      {
        ARAccountRef: { value: 'ar-1' },
        Id: 'credit-memo-1',
        Line: [
          {
            Amount: 10,
            SalesItemLineDetail: { ItemRef: { value: 'item-1' } },
          },
        ],
        TotalAmt: 10,
      },
      'ar-1',
      'income-1',
      'Credit Memo',
    ],
  ])(
    'maps native %s transactions',
    (type, transaction, creditAccountId, debitAccountId, expectedType) => {
      const transactions = mapNativeTransaction(
        type,
        transaction,
        new Map([
          [
            'item-1',
            {
              expenseAccountId: 'expense-1',
              incomeAccountId: 'income-1',
            },
          ],
        ]),
      )

      expect(transactions).toHaveLength(2)
      expect(transactions[0]).toMatchObject({
        accountId: creditAccountId,
        totalAmount: -10,
        type: expectedType,
      })
      expect(transactions[1]).toMatchObject({
        accountId: debitAccountId,
        totalAmount: 10,
        type: expectedType,
      })
    },
  )

  it('maps credit card payments, credits, and journal entries', () => {
    const payment = mapNativeTransaction('CreditCardPayment', {
      BankAccountRef: { value: 'bank-1' },
      CCAccountRef: { value: 'card-1' },
      Id: 'payment-1',
      TotalAmt: 50,
    })
    const credit = mapNativeTransaction('Purchase', {
      AccountRef: { value: 'card-1' },
      Credit: true,
      Id: 'credit-1',
      Line: [
        {
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: 'expense-1' },
          },
          Amount: 42,
        },
      ],
      TotalAmt: 42,
    })
    const journal = mapNativeTransaction('JournalEntry', {
      DocNumber: '3',
      Id: 'journal-1',
      Line: [
        {
          Amount: 20,
          Description: 'Adjustment',
          JournalEntryLineDetail: {
            AccountRef: { value: 'income-1' },
            PostingType: 'Credit',
          },
        },
        {
          Amount: 20,
          Description: 'Adjustment',
          JournalEntryLineDetail: {
            AccountRef: { value: 'expense-1' },
            PostingType: 'Debit',
          },
        },
      ],
    })

    expect(payment.map((transaction) => transaction.accountId)).toEqual(['bank-1', 'card-1'])
    expect(credit[0]).toMatchObject({
      accountId: 'expense-1',
      type: 'Credit Card Credit',
    })
    expect(journal[0]).toMatchObject({
      accountId: 'income-1',
      memo: 'Adjustment',
      reference: '3',
      totalAmount: -20,
      type: 'Journal Entry',
    })
    expect(mapNativeTransaction('Unsupported', { Id: '1' })).toEqual([])
    expect(mapNativeTransaction('Transfer', { Id: 'missing-accounts' })).toEqual([])
  })

  it('maps category, contact write payload, and malformed contact IDs', () => {
    expect(
      mapCategory(
        {
          Active: false,
          Id: 'class-1',
          MetaData: {
            CreateTime: '2026-01-01T00:00:00.000Z',
            LastUpdatedTime: '2026-01-02T00:00:00.000Z',
          },
          Name: 'West',
          ParentRef: { value: 'parent-1' },
        },
        'CLASS',
      ),
    ).toMatchObject({
      id: 'class-1',
      isActive: false,
      parentId: 'parent-1',
      type: 'CLASS',
    })
    expect(
      contactToQuickBooks({
        companyName: 'Zuno',
        emails: [{ email: 'hello@example.test' }],
        firstName: 'Zuno',
        isActive: true,
        lastName: 'Test',
        notes: 'Customer',
        telephones: [{ telephone: '+10000000000' }],
      }),
    ).toMatchObject({
      CompanyName: 'Zuno',
      PrimaryEmailAddr: { Address: 'hello@example.test' },
      PrimaryPhone: { FreeFormNumber: '+10000000000' },
    })
    expect(decodeContactId('not-base64-json')).toEqual({ id: 'not-base64-json' })
  })

  it('maps formatted P&L, balance sheet, cash flow, and trial balance values', () => {
    const profitLoss = mapReport('ProfitAndLoss', {
      Header: {
        Currency: 'USD',
        EndPeriod: '2026-10-22',
        ReportName: 'ProfitAndLoss',
        StartPeriod: '2026-01-01',
      },
      Rows: {
        Row: [
          {
            Header: { ColData: [{ value: 'Income' }, { value: '' }] },
            Rows: {
              Row: [
                {
                  ColData: [{ id: 'income-1', value: 'Sales' }, { value: '1,250.50' }],
                },
              ],
            },
            Summary: {
              ColData: [{ value: 'Total Income' }, { value: '1,250.50' }],
            },
            group: 'Income',
          },
          {
            Header: { ColData: [{ value: 'Expenses' }, { value: '' }] },
            Rows: {
              Row: [
                {
                  ColData: [{ id: 'expense-1', value: 'Fees' }, { value: '(250.25)' }],
                },
              ],
            },
            Summary: {
              ColData: [{ value: 'Total Expenses' }, { value: '250.25' }],
            },
            group: 'Expenses',
          },
          {
            Summary: {
              ColData: [{ value: 'Net Income' }, { value: '1,000.25' }],
            },
            group: 'NetIncome',
          },
        ],
      },
    })
    const balanceSheet = mapReport('BalanceSheet', {
      Header: { ReportName: 'BalanceSheet' },
      Rows: {
        Row: [
          {
            Header: { ColData: [{ value: 'ASSETS' }] },
            Rows: {
              Row: [
                {
                  ColData: [{ id: 'bank-1', value: 'Checking' }, { value: '100' }],
                },
              ],
            },
            Summary: { ColData: [{ value: 'TOTAL ASSETS' }, { value: '100' }] },
            group: 'Assets',
          },
          {
            Header: { ColData: [{ value: 'LIABILITIES AND EQUITY' }] },
            Rows: {
              Row: [
                {
                  Header: { ColData: [{ value: 'Liabilities' }] },
                  Rows: {
                    Row: [
                      {
                        Summary: {
                          ColData: [{ value: 'Current Liabilities' }, { value: '40' }],
                        },
                      },
                    ],
                  },
                },
                {
                  Header: { ColData: [{ value: 'Equity' }] },
                  Rows: {
                    Row: [
                      {
                        ColData: [
                          { id: 'equity-1', value: 'Opening Balance Equity' },
                          { value: '60' },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
            Summary: {
              ColData: [{ value: 'TOTAL LIABILITIES AND EQUITY' }, { value: '100' }],
            },
            group: 'LiabilitiesAndEquity',
          },
        ],
      },
    })
    const cashFlow = mapReport('CashFlow', {
      Header: { ReportName: 'CashFlow' },
      Rows: {
        Row: [
          {
            Summary: {
              ColData: [{ value: 'OPERATING ACTIVITIES' }, { value: '25' }],
            },
            group: 'OperatingActivities',
          },
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
    })
    const trialBalance = mapReport('TrialBalance', {
      Header: { ReportName: 'TrialBalance' },
      Rows: {
        GrandTotal: {
          ColData: [{ value: 'TOTAL' }, { value: '1,000.30' }, { value: '1,000.30' }],
        },
        Row: [
          {
            ColData: [{ id: 'bank-1', value: 'Checking' }, { value: '' }, { value: '975.30' }],
          },
          {
            ColData: [{ id: 'expense-1', value: 'Expense' }, { value: '25.00' }, { value: '' }],
          },
        ],
      },
    })

    expect(profitLoss).toMatchObject({
      expensesTotalAmount: 250.25,
      incomeTotalAmount: 1250.5,
      netIncomeAmount: 1000.25,
    })
    expect(balanceSheet).toMatchObject({ netAssetsAmount: 100 })
    expect(balanceSheet.assets?.[0]?.accountId).toBe('bank-1')
    expect(balanceSheet.liabilities?.[0]?.name).toBe('Current Liabilities')
    expect(balanceSheet.equity?.[0]?.accountId).toBe('equity-1')
    expect(cashFlow.netChangeInCashAmount).toBe(25)
    expect(trialBalance).toMatchObject({
      totalCreditAmount: 1000.3,
      totalDebitAmount: 1000.3,
    })
    expect(trialBalance.subItems).toEqual([
      { accountId: 'bank-1', accountName: 'Checking', amount: 975.3 },
      { accountId: 'expense-1', accountName: 'Expense', amount: -25 },
    ])
  })

  it('reports invalid transaction report rows', () => {
    expect(
      getTransactionReportDiagnostics({
        Columns: {
          Column: [
            { ColTitle: 'Transaction Type', ColType: 'txn_type' },
            { ColTitle: 'Amount', ColType: 'amount' },
          ],
        },
        Rows: {
          Row: [{ ColData: [{ value: 'Expense' }, { value: '0' }] }],
        },
      }),
    ).toMatchObject({
      rawRows: 1,
      skipped: {
        account: 1,
        amount: 1,
        splitAccount: 1,
        transactionId: 1,
      },
    })
  })

  it('maps sparse and complete account and contact payload variants', () => {
    const account = mapAccount({
      AccountSubType: 'AccountsReceivable',
      AccountType: 'Accounts Receivable',
      AcctNum: '1200',
      Active: false,
      Classification: 'Asset',
      CurrencyRef: { value: 'USD' },
      CurrentBalance: 200,
      Description: 'Receivables',
      Id: 'ar-1',
      MetaData: {
        CreateTime: '2026-01-01T00:00:00.000Z',
        LastUpdatedTime: '2026-01-02T00:00:00.000Z',
      },
      Name: 'Accounts Receivable',
      ParentRef: { value: 'asset-parent' },
    })
    const unknownAccount = mapAccount({
      AccountType: 'Unknown Type',
      Id: 'other-1',
      Name: 'Other',
    })
    const customer = mapContact(
      {
        Active: false,
        Balance: 25,
        BillAddr: {
          City: 'Los Angeles',
          Country: 'US',
          CountrySubDivisionCode: 'CA',
          Line1: '1 Main Street',
          Line2: 'Suite 2',
          PostalCode: '90001',
        },
        CompanyName: 'Zuno Customer',
        CurrencyRef: { value: 'USD' },
        FamilyName: 'Customer',
        GivenName: 'Zuno',
        Id: 'customer-1',
        Notes: 'Preferred',
        PrimaryEmailAddr: { Address: 'customer@example.test' },
        PrimaryPhone: { FreeFormNumber: '+10000000000' },
        ShipAddr: { City: 'San Francisco', Line1: '2 Market Street' },
      },
      'CUSTOMER',
    )

    expect(account).toMatchObject({
      balance: 200,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      currency: 'USD',
      customerDefinedCode: '1200',
      parentId: 'asset-parent',
      status: 'ARCHIVED',
      type: 'ACCOUNTS_RECEIVABLE',
    })
    expect(account.taxonomy).toHaveLength(3)
    expect(unknownAccount.taxonomy).toEqual([
      {
        originalType: 'Classification',
        type: 'CLASSIFICATION',
        value: 'Asset',
      },
      {
        originalType: 'AccountType',
        type: 'GROUP',
        value: 'Unknown Type',
      },
    ])
    expect(customer).toMatchObject({
      billingAddress: {
        addressLine1: '1 Main Street',
        addressLine2: 'Suite 2',
        city: 'Los Angeles',
        country: 'US',
        postalCode: '90001',
        state: 'CA',
      },
      emails: [{ email: 'customer@example.test', type: 'WORK' }],
      isActive: false,
      isCustomer: true,
      isSupplier: false,
      shippingAddress: {
        addressLine1: '2 Market Street',
        city: 'San Francisco',
      },
      telephones: [{ telephone: '+10000000000', type: 'WORK' }],
    })
    expect(
      contactToQuickBooks({
        companyName: 'Fallback Company',
        emails: [],
        telephones: [],
      }),
    ).toMatchObject({
      CompanyName: 'Fallback Company',
      DisplayName: 'Fallback Company',
      PrimaryEmailAddr: undefined,
      PrimaryPhone: undefined,
    })
  })

  it('maps report orientation and contact variants', () => {
    const report = {
      Columns: {
        Column: [
          { ColType: 'tx_date' },
          { ColType: 'txn_type' },
          { ColType: 'doc_num' },
          { ColType: 'name' },
          { ColType: 'memo' },
          { ColType: 'account_name' },
          { ColType: 'split_acc' },
          { ColType: 'amount' },
        ],
      },
      Rows: {
        Row: [
          {
            ColData: [
              { value: '2026-01-01' },
              { id: 'deposit-1', value: 'Deposit' },
              { value: '1' },
              { id: 'customer-1', value: 'Customer' },
              { value: 'Deposit memo' },
              { value: 'Checking' },
              { value: 'Sales' },
              { value: '100' },
            ],
          },
          {
            ColData: [
              { value: '2026-01-02' },
              { id: 'credit-1', value: 'Credit Card Credit' },
              { value: '2' },
              { id: 'vendor-1', value: 'Vendor' },
              { value: 'Credit memo' },
              { id: 'card-1', value: 'Card' },
              { id: 'expense-1', value: 'Expense' },
              { value: '25' },
            ],
          },
          {
            ColData: [
              { value: '2026-01-03' },
              { id: 'payment-1', value: 'Credit Card Payment' },
              { value: '3' },
              { value: '' },
              { value: 'Payment memo' },
              { id: 'bank-1', value: 'Checking' },
              { id: 'card-1', value: 'Card' },
              { value: '50' },
            ],
          },
        ],
      },
    }
    const transactions = mapTransactionReport(
      report,
      new Map([
        ['Checking', 'bank-1'],
        ['Sales', 'income-1'],
      ]),
      new Map([
        ['bank-1', 'Bank'],
        ['card-1', 'Credit Card'],
      ]),
    )

    expect(transactions).toHaveLength(6)
    expect(transactions[0]).toMatchObject({
      accountId: 'income-1',
      splitAccountId: 'bank-1',
    })
    expect(transactions[0]?.contacts?.[0]).toMatchObject({ isSupplier: true })
    expect(transactions[2]).toMatchObject({
      accountId: 'expense-1',
      splitAccountId: 'card-1',
    })
    expect(transactions[2]?.contacts?.[0]).toMatchObject({ isSupplier: true })
    expect(transactions[4]).toMatchObject({
      accountId: 'bank-1',
      splitAccountId: 'card-1',
    })
  })

  it('maps remaining report section and total fallbacks', () => {
    const profitLoss = mapReport('ProfitAndLoss', {
      Header: { ReportName: 'ProfitAndLoss' },
      Rows: {
        Row: [
          {
            Header: { ColData: [{ value: 'Other Income' }, { value: '' }] },
            Rows: {
              Row: [
                {
                  Header: {
                    ColData: [{ id: 'parent-income', value: 'Parent Income' }, { value: '5' }],
                  },
                  Rows: {
                    Row: [
                      {
                        ColData: [{ id: 'child-income', value: 'Child Income' }, { value: '10' }],
                      },
                    ],
                  },
                  Summary: {
                    ColData: [{ value: 'Total Parent Income' }, { value: '15' }],
                  },
                },
              ],
            },
            Summary: {
              ColData: [{ value: 'Total Other Income' }, { value: '15' }],
            },
            group: 'OtherIncome',
          },
          {
            Header: { ColData: [{ value: 'Other Expenses' }, { value: '' }] },
            Rows: {
              Row: [
                {
                  ColData: [{ id: 'other-expense', value: 'Other Expense' }, { value: '3' }],
                },
              ],
            },
            Summary: {
              ColData: [{ value: 'Total Other Expenses' }, { value: '3' }],
            },
            group: 'OtherExpenses',
          },
          {
            Header: { ColData: [{ value: 'Cost of Sales' }, { value: '' }] },
            Rows: {
              Row: [
                {
                  ColData: [{ id: 'cogs-1', value: 'Materials' }, { value: '4' }],
                },
              ],
            },
            Summary: {
              ColData: [{ value: 'Total Cost of Sales' }, { value: '4' }],
            },
            group: 'CostOfSales',
          },
        ],
      },
    })
    const cashFlow = mapReport('CashFlow', {
      Header: { ReportName: 'CashFlow' },
      Rows: {
        Row: [
          {
            Summary: {
              ColData: [{ value: 'Net cash from financing' }, { value: '20' }],
            },
            group: 'FinancingActivities',
          },
          {
            Summary: {
              ColData: [{ value: 'Net change in cash' }, { value: '20' }],
            },
            group: 'NetChangeInCash',
          },
        ],
      },
    })
    const trialBalance = mapReport('TrialBalance', {
      Header: { ReportName: 'TrialBalance' },
      Rows: {
        Row: [
          {
            ColData: [{ value: '' }, { value: '1' }, { value: '1' }],
          },
          {
            Summary: {
              ColData: [{ value: 'TOTAL' }, { value: '10' }, { value: '10' }],
            },
            group: 'GrandTotal',
            type: 'Section',
          },
        ],
      },
    })

    expect(profitLoss.incomeSections?.[0]?.accounts).toHaveLength(2)
    expect(profitLoss.expensesSections?.[0]?.sectionName).toContain('Other Expense')
    expect(profitLoss.costOfGoodsSoldTotalAmount).toBe(4)
    expect(cashFlow.financingSections?.[0]?.totalAmount).toBe(20)
    expect(cashFlow.netChangeInCashAmount).toBe(20)
    expect(trialBalance.subItems).toEqual([])
    expect(trialBalance.totalDebitAmount).toBe(10)
    expect(mapReport('Unknown', { Header: { ReportName: 'Unknown' } })).toMatchObject({
      name: 'Unknown',
    })
  })

  it('uses General Ledger metadata keys and removes duplicates', () => {
    const result = mapGeneralLedgerTransactionIdsByAccount({
      Columns: {
        Column: [
          { MetaData: [{ Name: 'ColKey', Value: 'txn_type' }] },
          { MetaData: [{ Name: 'ColKey', Value: 'doc_num' }] },
          { ColType: 'Money', MetaData: [{ Name: 'ColKey', Value: 'subt_nat_amount' }] },
        ],
      },
      Rows: {
        Row: [
          {
            Header: { ColData: [{ id: 'bank-1', value: 'Checking' }] },
            Rows: {
              Row: [
                {
                  ColData: [{ id: 'txn-1', value: 'Expense' }, { value: '1' }, { value: '-10' }],
                },
                {
                  ColData: [{ id: 'txn-1', value: 'Expense' }, { value: '1' }, { value: '-10' }],
                },
                {
                  ColData: [{ value: 'Expense' }, { value: '' }, { value: '0' }],
                },
              ],
            },
          },
        ],
      },
    })

    expect(result.get('bank-1')).toHaveLength(1)
  })

  it('covers sparse Intuit fallback branches', () => {
    expect(
      mapAccount({
        AccountType: 'Accounts Payable',
        Id: 'ap-1',
        Name: 'Payables',
      }),
    ).toMatchObject({
      isPayable: true,
      status: 'ACTIVE',
      type: 'ACCOUNTS_PAYABLE',
    })
    expect(
      mapContact(
        {
          FullyQualifiedName: 'Fallback Vendor',
          Id: 'vendor-1',
        },
        'SUPPLIER',
      ),
    ).toMatchObject({
      billingAddress: undefined,
      emails: [],
      isActive: true,
      name: 'Fallback Vendor',
      shippingAddress: undefined,
      telephones: [],
    })

    const itemExpense = mapNativeTransaction(
      'Purchase',
      {
        AccountRef: { value: 'bank-1' },
        CustomerMemo: { value: 'Customer memo' },
        Id: 'purchase-item',
        Line: [
          {
            Amount: 12,
            ItemBasedExpenseLineDetail: { ItemRef: { value: 'item-1' } },
          },
        ],
        TotalAmt: 12,
      },
      new Map([
        [
          'item-1',
          {
            expenseAccountId: 'expense-1',
            incomeAccountId: 'income-1',
          },
        ],
      ]),
    )
    const deposit = mapNativeTransaction('Deposit', {
      DepositToAccountRef: { value: 'bank-1' },
      Id: 'deposit-customer',
      Line: [
        {
          Amount: 15,
          DepositLineDetail: {
            AccountRef: { value: 'income-1' },
            Entity: { type: 'CUSTOMER', value: 'customer-1' },
          },
        },
      ],
      TotalAmt: 15,
    })
    const cardBillPayment = mapNativeTransaction('BillPayment', {
      APAccountRef: { value: 'ap-1' },
      CreditCardPayment: { CCAccountRef: { value: 'card-1' } },
      DocNumber: 'BILL-1',
      Id: 'bill-card',
      TotalAmt: 20,
    })

    expect(itemExpense[0]?.memo).toBe('Customer memo')
    expect(deposit[0]?.contacts?.[0]).toMatchObject({ isCustomer: true })
    expect(cardBillPayment[0]).toMatchObject({
      accountId: 'card-1',
      type: 'Bill Payment (Credit Card)',
    })

    const reversedCardPayment = mapTransactionReport(
      {
        Columns: {
          Column: [
            { ColTitle: 'Transaction Type' },
            { ColTitle: 'Account' },
            { ColTitle: 'Split' },
            { ColTitle: 'Amount' },
          ],
        },
        Rows: {
          Row: [
            {
              ColData: [
                { id: 'card-payment', value: 'Credit Card Payment' },
                { id: 'card-1', value: 'Card' },
                { id: 'bank-1', value: 'Checking' },
                { value: '-20' },
              ],
            },
          ],
        },
      },
      new Map(),
      new Map([
        ['bank-1', 'Bank'],
        ['card-1', 'Credit Card'],
      ]),
    )

    expect(reversedCardPayment[0]).toMatchObject({
      accountId: 'bank-1',
      splitAccountId: 'card-1',
    })

    const numericReport = mapReport('ProfitAndLoss', {
      Header: { ReportName: 'ProfitAndLoss' },
      Rows: {
        Row: [
          {
            Header: { ColData: [{ value: 'Income' }, { value: 10 }] },
            Rows: {
              Row: [
                {
                  ColData: [{ value: '' }, { value: Number.NaN }],
                },
              ],
            },
            Summary: { ColData: [{ value: 'Total Income' }, { value: 10 }] },
            group: 'Income',
          },
        ],
      },
    })
    const wrappedBalanceSheet = mapReport('BalanceSheet', {
      Header: { ReportName: 'BalanceSheet' },
      Rows: {
        Row: [
          {
            Rows: { Row: [] },
            Summary: {
              ColData: [{ value: 'TOTAL LIABILITIES AND EQUITY' }, { value: '30' }],
            },
            group: 'TotalLiabilitiesAndEquity',
          },
        ],
      },
    })

    expect(numericReport.incomeTotalAmount).toBe(10)
    expect(wrappedBalanceSheet.netAssetsAmount).toBe(30)
  })
})
