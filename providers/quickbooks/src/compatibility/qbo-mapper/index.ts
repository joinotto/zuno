// SPDX-License-Identifier: Apache-2.0

import type {
  AccountingAccount,
  AccountingAddress,
  AccountingCategory,
  AccountingContact,
  AccountingTransaction,
} from '../types.js'
import { encodeTransactionLegId } from './transaction-id.js'

export { mapGeneralLedgerTransactionIdsByAccount, mapReport } from './report.js'

const accountTypeMap: Record<string, string> = {
  'Accounts Payable': 'ACCOUNTS_PAYABLE',
  'Accounts Receivable': 'ACCOUNTS_RECEIVABLE',
  Bank: 'BANK',
  'Cost of Goods Sold': 'EXPENSE',
  'Credit Card': 'CREDIT_CARD',
  'Current Liability': 'LIABILITY',
  Equity: 'EQUITY',
  Expense: 'EXPENSE',
  'Fixed Asset': 'FIXED_ASSET',
  Income: 'REVENUE',
  'Long Term Liability': 'LIABILITY',
  'Other Asset': 'FIXED_ASSET',
  'Other Current Asset': 'FIXED_ASSET',
  'Other Current Liability': 'LIABILITY',
  'Other Expense': 'EXPENSE',
  'Other Income': 'REVENUE',
}

const accountClassificationMap: Record<string, string> = {
  ACCOUNTS_PAYABLE: 'liability',
  ACCOUNTS_RECEIVABLE: 'asset',
  BANK: 'asset',
  CREDIT_CARD: 'liability',
  EQUITY: 'equity',
  EXPENSE: 'expense',
  FIXED_ASSET: 'asset',
  LIABILITY: 'liability',
  OTHER: 'asset',
  REVENUE: 'revenue',
}

type ItemAccounts = Map<string, { expenseAccountId?: string; incomeAccountId?: string }>

function date(value?: string): Date | undefined {
  return value ? new Date(value) : undefined
}

function address(value?: Record<string, any>): AccountingAddress | undefined {
  if (!value) {
    return undefined
  }

  return {
    addressLine1: value.Line1,
    addressLine2: value.Line2,
    city: value.City,
    country: value.Country,
    postalCode: value.PostalCode,
    state: value.CountrySubDivisionCode,
  }
}

export function mapAccount(account: Record<string, any>): AccountingAccount {
  const type = accountTypeMap[account.AccountType] ?? 'OTHER'
  const classification = accountClassificationMap[type] ?? 'asset'

  return {
    balance: account.CurrentBalance,
    createdAt: date(account.MetaData?.CreateTime),
    currency: account.CurrencyRef?.value,
    customerDefinedCode: account.AcctNum,
    description: account.Description,
    id: String(account.Id),
    isPayable: type === 'ACCOUNTS_PAYABLE',
    name: account.Name,
    parentId: account.ParentRef?.value,
    raw: account,
    status: account.Active === false ? 'ARCHIVED' : 'ACTIVE',
    taxonomy: [
      {
        originalType: 'Classification',
        type: 'CLASSIFICATION',
        value:
          account.Classification ?? classification.replace(/^./u, (value) => value.toUpperCase()),
      },
      ...(account.AccountType
        ? [
            {
              originalType: 'AccountType',
              type: 'GROUP',
              value: String(account.AccountType),
            },
          ]
        : []),
      ...(account.AccountSubType
        ? [
            {
              originalType: 'AccountSubType',
              type: 'SUBGROUP',
              value: String(account.AccountSubType),
            },
          ]
        : []),
    ],
    type,
    updatedAt: date(account.MetaData?.LastUpdatedTime),
  } as AccountingAccount
}

export function mapCategory(
  category: Record<string, any>,
  type: 'CLASS' | 'DEPARTMENT',
): AccountingCategory {
  return {
    createdAt: date(category.MetaData?.CreateTime),
    id: String(category.Id),
    isActive: category.Active !== false,
    name: category.Name,
    parentId: category.ParentRef?.value,
    raw: category,
    type,
    updatedAt: date(category.MetaData?.LastUpdatedTime),
  } as AccountingCategory
}

export function mapContact(
  contact: Record<string, any>,
  type: 'CUSTOMER' | 'SUPPLIER',
): AccountingContact {
  return {
    balanceAmount: contact.Balance,
    billingAddress: address(contact.BillAddr),
    companyName: contact.CompanyName,
    createdAt: date(contact.MetaData?.CreateTime),
    currency: contact.CurrencyRef?.value,
    emails: contact.PrimaryEmailAddr?.Address
      ? [{ email: contact.PrimaryEmailAddr.Address, type: 'WORK' }]
      : [],
    firstName: contact.GivenName,
    id: encodeContactId(type, String(contact.Id)),
    isActive: contact.Active !== false,
    isCustomer: type === 'CUSTOMER',
    isSupplier: type === 'SUPPLIER',
    lastName: contact.FamilyName,
    name: contact.DisplayName ?? contact.CompanyName ?? contact.FullyQualifiedName,
    notes: contact.Notes,
    raw: contact,
    shippingAddress: address(contact.ShipAddr),
    telephones: contact.PrimaryPhone?.FreeFormNumber
      ? [{ telephone: contact.PrimaryPhone.FreeFormNumber, type: 'WORK' }]
      : [],
    updatedAt: date(contact.MetaData?.LastUpdatedTime),
  } as AccountingContact
}

export function encodeContactId(type: 'CUSTOMER' | 'SUPPLIER', id: string): string {
  return Buffer.from(JSON.stringify({ type, c_id: id })).toString('base64')
}

export function decodeContactId(id: string): {
  id: string
  type?: 'CUSTOMER' | 'SUPPLIER'
} {
  try {
    const decoded = JSON.parse(Buffer.from(id, 'base64').toString('utf8'))

    if ((decoded.type === 'CUSTOMER' || decoded.type === 'SUPPLIER') && decoded.c_id) {
      return { id: String(decoded.c_id), type: decoded.type }
    }
  } catch {
    return { id }
  }

  return { id }
}

export function contactToQuickBooks(contact: AccountingContact): Record<string, any> {
  return {
    Active: contact.isActive,
    CompanyName: contact.companyName,
    DisplayName: contact.name ?? contact.companyName,
    FamilyName: contact.lastName,
    GivenName: contact.firstName,
    Notes: contact.notes,
    PrimaryEmailAddr: contact.emails?.[0]?.email ? { Address: contact.emails[0].email } : undefined,
    PrimaryPhone: contact.telephones?.[0]?.telephone
      ? { FreeFormNumber: contact.telephones[0].telephone }
      : undefined,
  }
}

function refId(value?: Record<string, any>): string | undefined {
  return value?.value ? String(value.value) : undefined
}

function nativeContacts(
  transaction: Record<string, any>,
): NonNullable<AccountingTransaction['contacts']> {
  const lineEntity = (transaction.Line ?? [])
    .map((line: Record<string, any>) => line.DepositLineDetail?.Entity)
    .find(Boolean)
  const customerId =
    refId(transaction.CustomerRef) ??
    (String(lineEntity?.type ?? '').toUpperCase() === 'CUSTOMER' ? refId(lineEntity) : undefined)
  const vendorId =
    refId(transaction.VendorRef ?? transaction.EntityRef) ??
    (String(lineEntity?.type ?? '').toUpperCase() === 'VENDOR' ? refId(lineEntity) : undefined)

  return [
    ...(customerId ? [{ id: encodeContactId('CUSTOMER', customerId), isCustomer: true }] : []),
    ...(vendorId ? [{ id: encodeContactId('SUPPLIER', vendorId), isSupplier: true }] : []),
  ]
}

function nativeLineAccountId(
  line: Record<string, any>,
  itemAccounts: ItemAccounts,
  kind: 'expense' | 'income',
): string | undefined {
  const direct =
    refId(line.AccountBasedExpenseLineDetail?.AccountRef) ??
    refId(line.DepositLineDetail?.AccountRef) ??
    refId(line.JournalEntryLineDetail?.AccountRef)

  if (direct) {
    return direct
  }

  const itemId =
    refId(line.SalesItemLineDetail?.ItemRef) ?? refId(line.ItemBasedExpenseLineDetail?.ItemRef)
  const item = itemId ? itemAccounts.get(itemId) : undefined
  return kind === 'income' ? item?.incomeAccountId : item?.expenseAccountId
}

function nativeLines(
  transaction: Record<string, any>,
  itemAccounts: ItemAccounts,
  kind: 'expense' | 'income',
): NonNullable<AccountingTransaction['lineitems']> {
  return (transaction.Line ?? []).flatMap((line: Record<string, any>, index: number) => {
    const accountId = nativeLineAccountId(line, itemAccounts, kind)
    const amount = Math.abs(Number(line.Amount ?? 0))

    if (!accountId || !amount) {
      return []
    }

    return [
      {
        accountId,
        description: line.Description,
        id: String(line.Id ?? index + 1),
        totalAmount: amount,
      },
    ]
  })
}

function nativeLegs(input: {
  amount?: number | undefined
  creditAccountId?: string | undefined
  debitAccountId?: string | undefined
  lines?: AccountingTransaction['lineitems'] | undefined
  memo?: string | undefined
  reference?: string | undefined
  transaction: Record<string, any>
  type: string
}): AccountingTransaction[] {
  const { transaction } = input
  const transactionId = String(transaction.Id ?? '')
  const amount = Math.abs(
    Number(
      input.amount ??
        transaction.TotalAmt ??
        transaction.Amount ??
        input.lines?.reduce((sum, line) => sum + Math.abs(Number(line.totalAmount ?? 0)), 0) ??
        0,
    ),
  )

  if (!transactionId || !input.creditAccountId || !input.debitAccountId || !amount) {
    return []
  }

  const shared = {
    contacts: nativeContacts(transaction),
    memo:
      input.memo ??
      transaction.PrivateNote ??
      transaction.CustomerMemo?.value ??
      transaction.DocNumber,
    raw: transaction,
    reference: input.reference,
    status: 'POSTED' as const,
    transactionAt: date(transaction.TxnDate),
    type: input.type,
  }

  return [
    {
      ...shared,
      accountId: input.creditAccountId,
      id: encodeTransactionLegId('credit', transactionId, -amount),
      splitAccountId: input.debitAccountId,
      totalAmount: -amount,
    },
    {
      ...shared,
      accountId: input.debitAccountId,
      id: encodeTransactionLegId('debit', transactionId, amount),
      lineitems: [
        {
          accountId: input.debitAccountId,
          id: transactionId,
          totalAmount: amount,
        },
      ],
      splitAccountId: input.creditAccountId,
      totalAmount: amount,
    },
  ] as AccountingTransaction[]
}

export function mapNativeTransaction(
  type: string,
  transaction: Record<string, any>,
  itemAccounts: ItemAccounts = new Map(),
): AccountingTransaction[] {
  const expenseLines = nativeLines(transaction, itemAccounts, 'expense')
  const incomeLines = nativeLines(transaction, itemAccounts, 'income')
  const expenseAccountId = expenseLines?.[0]?.accountId
  const incomeAccountId = incomeLines?.[0]?.accountId

  switch (type) {
    case 'Purchase': {
      const isCredit = transaction.Credit === true

      return nativeLegs({
        creditAccountId: isCredit ? expenseAccountId : refId(transaction.AccountRef),
        debitAccountId: isCredit ? refId(transaction.AccountRef) : expenseAccountId,
        lines: expenseLines,
        transaction,
        type: isCredit ? 'Credit Card Credit' : 'Expense',
      })
    }
    case 'Deposit':
      return nativeLegs({
        creditAccountId: incomeAccountId,
        debitAccountId: refId(transaction.DepositToAccountRef),
        lines: incomeLines,
        transaction,
        type,
      })
    case 'Transfer':
      return nativeLegs({
        creditAccountId: refId(transaction.FromAccountRef),
        debitAccountId: refId(transaction.ToAccountRef),
        transaction,
        type,
      })
    case 'CreditCardPayment':
      return nativeLegs({
        creditAccountId: refId(transaction.BankAccountRef),
        debitAccountId: refId(transaction.CCAccountRef),
        transaction,
        type: 'Credit Card Payment',
      })
    case 'Payment':
      return nativeLegs({
        creditAccountId: refId(transaction.ARAccountRef),
        debitAccountId: refId(transaction.DepositToAccountRef),
        transaction,
        type,
      })
    case 'Bill':
      return nativeLegs({
        creditAccountId: refId(transaction.APAccountRef),
        debitAccountId: expenseAccountId,
        lines: expenseLines,
        transaction,
        type,
      })
    case 'BillPayment':
      return nativeLegs({
        creditAccountId:
          refId(transaction.CheckPayment?.BankAccountRef) ??
          refId(transaction.CreditCardPayment?.CCAccountRef),
        debitAccountId: refId(transaction.APAccountRef),
        transaction,
        type: transaction.CheckPayment ? 'Bill Payment (Check)' : 'Bill Payment (Credit Card)',
      })
    case 'Invoice':
    case 'SalesReceipt':
      return nativeLegs({
        creditAccountId: incomeAccountId,
        debitAccountId:
          type === 'Invoice'
            ? refId(transaction.ARAccountRef)
            : refId(transaction.DepositToAccountRef),
        lines: incomeLines,
        transaction,
        type: type === 'SalesReceipt' ? 'Sales Receipt' : type,
      })
    case 'RefundReceipt':
      return nativeLegs({
        creditAccountId: refId(transaction.DepositToAccountRef),
        debitAccountId: incomeAccountId,
        lines: incomeLines,
        transaction,
        type: 'Refund Receipt',
      })
    case 'VendorCredit':
      return nativeLegs({
        creditAccountId: expenseAccountId,
        debitAccountId: refId(transaction.APAccountRef),
        lines: expenseLines,
        transaction,
        type: 'Vendor Credit',
      })
    case 'CreditMemo':
      return nativeLegs({
        creditAccountId: refId(transaction.ARAccountRef),
        debitAccountId: incomeAccountId,
        lines: incomeLines,
        transaction,
        type: 'Credit Memo',
      })
    case 'JournalEntry': {
      const creditLines = (transaction.Line ?? []).filter(
        (line: Record<string, any>) => line.JournalEntryLineDetail?.PostingType === 'Credit',
      )
      const debitLines = (transaction.Line ?? []).filter(
        (line: Record<string, any>) => line.JournalEntryLineDetail?.PostingType === 'Debit',
      )
      const creditLine = creditLines.at(-1)
      const debitLine = debitLines.at(-1)
      const debitAccountId = nativeLineAccountId(debitLine ?? {}, itemAccounts, 'expense')

      return nativeLegs({
        amount: Math.abs(Number(creditLine?.Amount ?? 0)),
        creditAccountId: nativeLineAccountId(creditLine ?? {}, itemAccounts, 'income'),
        debitAccountId,
        memo: debitLine?.Description ?? creditLine?.Description ?? transaction.PrivateNote,
        reference: transaction.DocNumber,
        transaction,
        type: 'Journal Entry',
      })
    }
    default:
      return []
  }
}

function transactionReportRows(report: Record<string, any>): Array<Record<string, any>> {
  const rows: Array<Record<string, any>> = []
  const collect = (
    items: Array<Record<string, any>> = [],
    sectionAccount?: Record<string, any>,
  ): void => {
    for (const item of items) {
      const currentSectionAccount =
        item.Header?.ColData?.[0]?.id || item.Header?.ColData?.[0]?.value
          ? item.Header.ColData[0]
          : sectionAccount

      if (item.ColData) {
        rows.push({ ...item, sectionAccount: currentSectionAccount })
      }

      if (item.Rows?.Row) {
        collect(item.Rows.Row, currentSectionAccount)
      }
    }
  }

  collect(report.Rows?.Row)
  return rows
}

function transactionReportValues(
  columns: Array<Record<string, any>>,
  row: Record<string, any>,
): Record<string, Record<string, any> | undefined> {
  const values: Record<string, Record<string, any> | undefined> = {}

  columns.forEach((column, index) => {
    const cell = row.ColData[index]

    if (column.ColTitle) {
      values[column.ColTitle] = cell
    }

    if (column.ColType && !values[column.ColType]) {
      values[column.ColType] = cell
    }
  })

  return values
}

export function getTransactionReportDiagnostics(report: Record<string, any>): {
  columns: Array<{ title: unknown; type: unknown }>
  rawRows: number
  skipped: { account: number; amount: number; splitAccount: number; transactionId: number }
} {
  const columns = report.Columns?.Column ?? []
  const rows = transactionReportRows(report)
  const skipped = { account: 0, amount: 0, splitAccount: 0, transactionId: 0 }

  for (const row of rows) {
    const values = transactionReportValues(columns, row)
    const value = (...keys: string[]) =>
      keys.map((key) => values[key]).find((candidate) => candidate !== undefined)
    const transactionId =
      value('Num', 'doc_num')?.id ?? value('Transaction Type', 'txn_type')?.id ?? row.id
    const amount = Number(value('Amount', 'subt_nat_amount', 'amount')?.value ?? 0)
    const account = value('Account', 'account_name') ?? row.sectionAccount
    const split = value('Split', 'split_acc')

    if (!transactionId) {
      skipped.transactionId += 1
    }
    if (!amount) {
      skipped.amount += 1
    }
    if (!account?.id && !account?.value) {
      skipped.account += 1
    }
    if (!split?.id && !split?.value) {
      skipped.splitAccount += 1
    }
  }

  return {
    columns: columns.map((column: Record<string, any>) => ({
      title: column.ColTitle,
      type: column.ColType,
    })),
    rawRows: rows.length,
    skipped,
  }
}

export function mapTransactionReport(
  report: Record<string, any>,
  accountIdsByName: Map<string, string>,
  accountTypesById: Map<string, string> = new Map(),
): AccountingTransaction[] {
  const columns = report.Columns?.Column ?? []
  const rows = transactionReportRows(report)
  const result: AccountingTransaction[] = []

  for (const row of rows) {
    const values = transactionReportValues(columns, row)
    const value = (...keys: string[]) =>
      keys.map((key) => values[key]).find((candidate) => candidate !== undefined)
    const number = value('Num', 'doc_num')
    const transactionType = value('Transaction Type', 'txn_type')
    const amountValue = value('Amount', 'subt_nat_amount', 'amount')
    const account = value('Account', 'account_name') ?? row.sectionAccount
    const split = value('Split', 'split_acc')
    const memo = value('Memo/Description', 'Memo', 'memo')
    const contact = value('Name', 'name')
    const transactionDate = value('Date', 'tx_date')
    const transactionId = String(number?.id ?? transactionType?.id ?? row.id ?? '')
    const amount = Number(amountValue?.value ?? 0)
    const accountName = String(account?.value ?? '')
    const splitName = String(split?.value ?? '')
    const accountId = account?.id ?? accountIdsByName.get(accountName)
    const splitAccountId = split?.id ?? accountIdsByName.get(splitName)

    if (!transactionId || !accountId || !splitAccountId || !amount) {
      continue
    }

    const absoluteAmount = Math.abs(amount)
    const type = String(transactionType?.value ?? '')
    const accountType = accountTypesById.get(String(accountId))
    const splitAccountType = accountTypesById.get(String(splitAccountId))
    const creditCardPaymentOrientation =
      type === 'Credit Card Payment' && accountType === 'Bank' && splitAccountType === 'Credit Card'
        ? [accountId, splitAccountId]
        : type === 'Credit Card Payment' &&
            accountType === 'Credit Card' &&
            splitAccountType === 'Bank'
          ? [splitAccountId, accountId]
          : undefined
    const reportOrientation = {
      Deposit: [splitAccountId, accountId],
      Expense: [accountId, splitAccountId],
      'Credit Card Credit': [splitAccountId, accountId],
    }[type]
    const creditAccountId =
      creditCardPaymentOrientation?.[0] ??
      reportOrientation?.[0] ??
      (amount < 0 ? accountId : splitAccountId)
    const debitAccountId =
      creditCardPaymentOrientation?.[1] ??
      reportOrientation?.[1] ??
      (amount < 0 ? splitAccountId : accountId)
    const customerTransaction = ['Invoice', 'Payment', 'Sales Receipt'].includes(type)
    const shared = {
      contacts: contact?.id
        ? [
            {
              id: encodeContactId(
                customerTransaction ? 'CUSTOMER' : 'SUPPLIER',
                String(contact.id),
              ),
              ...(customerTransaction ? { isCustomer: true } : { isSupplier: true }),
            },
          ]
        : [],
      memo: memo?.value,
      raw: { columns: values, reportRow: row },
      status: 'POSTED' as const,
      totalAmount: absoluteAmount,
      transactionAt: date(transactionDate?.value),
      type,
    }

    result.push(
      {
        ...shared,
        accountId: creditAccountId,
        id: encodeTransactionLegId('credit', transactionId, -absoluteAmount),
        splitAccountId: debitAccountId,
        totalAmount: -absoluteAmount,
      } as AccountingTransaction,
      {
        ...shared,
        accountId: debitAccountId,
        id: encodeTransactionLegId('debit', transactionId, absoluteAmount),
        lineitems: [
          {
            accountId: debitAccountId,
            id: transactionId,
            totalAmount: absoluteAmount,
          },
        ],
        splitAccountId: creditAccountId,
      } as AccountingTransaction,
    )
  }

  return result
}
