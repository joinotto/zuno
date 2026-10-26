// SPDX-License-Identifier: Apache-2.0

import type { AccountingReport } from '../types.js'
import { encodeTransactionLegId } from './transaction-id.js'

type TransactionIdsByAccount = ReadonlyMap<string, string[]>

interface ReportSection {
  item: Record<string, any>
  key: string
}

function date(value?: string): Date | undefined {
  return value ? new Date(value) : undefined
}

function numeric(value?: number | string): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  const normalized = String(value ?? '')
    .trim()
    .replaceAll(',', '')
    .replace(/^\((.*)\)$/u, '-$1')
    .replace(/[^0-9.+-]/gu, '')
  const parsed = Number(normalized || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function reportItem(
  row: Record<string, any>,
  transactionIdsByAccount: TransactionIdsByAccount,
): Record<string, any> {
  const header = row.Header?.ColData ?? row.ColData ?? []
  const summary = row.Summary?.ColData ?? []
  const accountId = header[0]?.id ?? summary[0]?.id
  const transactionIds = accountId ? transactionIdsByAccount.get(String(accountId)) : undefined
  const children = (row.Rows?.Row ?? []).map((child: Record<string, any>) =>
    reportItem(child, transactionIdsByAccount),
  )

  return {
    accountId,
    amount: numeric(summary.at(-1)?.value ?? header.at(-1)?.value),
    name: header[0]?.value ?? summary[0]?.value ?? row.group ?? '',
    ownAmount: numeric(header.at(-1)?.value),
    ...(transactionIds?.length ? { transactionIds } : {}),
    ...(children.length ? { subItems: children } : {}),
  }
}

function reportKey(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/gu, '')
}

function reportSections(
  report: Record<string, any>,
  transactionIdsByAccount: TransactionIdsByAccount,
): ReportSection[] {
  return (report.Rows?.Row ?? []).map((row: Record<string, any>) => ({
    item: reportItem(row, transactionIdsByAccount),
    key: reportKey(
      row.group ?? row.Header?.ColData?.[0]?.value ?? row.Summary?.ColData?.[0]?.value,
    ),
  }))
}

function columnKey(column: Record<string, any>): unknown {
  return column.MetaData?.find((metadata: Record<string, any>) => metadata.Name === 'ColKey')?.Value
}

function columnIndex(columns: Record<string, any>[], candidates: string[]): number {
  return columns.findIndex(
    (column) =>
      candidates.includes(column.ColTitle) ||
      candidates.includes(column.ColType) ||
      candidates.includes(String(columnKey(column) ?? '')),
  )
}

export function mapGeneralLedgerTransactionIdsByAccount(
  report: Record<string, any>,
): Map<string, string[]> {
  const columns = report.Columns?.Column ?? []
  const transactionTypeIndex = columnIndex(columns, ['Transaction Type', 'txn_type'])
  const documentNumberIndex = columnIndex(columns, ['Num', 'doc_num'])
  const amountIndex = columnIndex(columns, ['Amount', 'Money', 'subt_nat_amount', 'amount'])
  const result = new Map<string, string[]>()
  const seen = new Map<string, Set<string>>()

  const collect = (rows: Record<string, any>[] = [], sectionAccountId?: string): void => {
    for (const row of rows) {
      const headerAccountId = row.Header?.ColData?.[0]?.id
      const accountId = headerAccountId ? String(headerAccountId) : sectionAccountId

      if (row.ColData && accountId && amountIndex >= 0) {
        const transactionId = String(
          row.ColData[transactionTypeIndex]?.id ??
            row.ColData[documentNumberIndex]?.id ??
            row.id ??
            '',
        )
        const amount = numeric(row.ColData[amountIndex]?.value)

        if (transactionId && amount) {
          const encoded = encodeTransactionLegId(
            amount < 0 ? 'debit' : 'credit',
            transactionId,
            Math.abs(amount),
          )
          const accountSeen = seen.get(accountId) ?? new Set<string>()

          if (!accountSeen.has(encoded)) {
            accountSeen.add(encoded)
            seen.set(accountId, accountSeen)
            result.set(accountId, [...(result.get(accountId) ?? []), encoded])
          }
        }
      }

      collect(row.Rows?.Row, accountId)
    }
  }

  collect(report.Rows?.Row)
  return result
}

function pnlSections(
  sections: ReportSection[],
  type: 'cogs' | 'expenses' | 'income',
): Array<Record<string, any>> {
  const accounts = (items: Record<string, any>[]): Array<Record<string, any>> =>
    items.flatMap((item) => {
      if (!item.subItems?.length) {
        if (!item.accountId || !item.name) {
          return []
        }

        return [
          {
            accountId: item.accountId,
            accountName: item.name,
            totalAmount: Number(item.amount ?? 0),
            ...(item.transactionIds?.length ? { transactionIds: item.transactionIds } : {}),
          },
        ]
      }

      const parent =
        item.accountId && item.name && Number(item.ownAmount ?? 0) !== 0
          ? [
              {
                accountId: item.accountId,
                accountName: item.name,
                totalAmount: Number(item.ownAmount),
                ...(item.transactionIds?.length ? { transactionIds: item.transactionIds } : {}),
              },
            ]
          : []

      return [...parent, ...accounts(item.subItems)]
    })

  return sections.flatMap(({ item }) => {
    const sectionAccounts = accounts(item.subItems ?? [])

    if (!sectionAccounts.length && Number(item.amount ?? 0) === 0) {
      return []
    }

    return [
      {
        accounts: sectionAccounts,
        sectionName: item.name,
        sectionType: type,
        totalAmount: Number(item.amount ?? 0),
      },
    ]
  })
}

export function mapReport(
  name: string,
  report: Record<string, any>,
  transactionIdsByAccount: TransactionIdsByAccount = new Map(),
): AccountingReport {
  const base = {
    createdAt: date(report.Header?.Time),
    currency: report.Header?.Currency,
    endAt: date(report.Header?.EndPeriod),
    id: `${name}:${report.Header?.StartPeriod ?? 'all'}:${report.Header?.EndPeriod ?? 'all'}`,
    name: report.Header?.ReportName ?? name,
    raw: report,
    startAt: date(report.Header?.StartPeriod),
    updatedAt: date(report.Header?.Time),
  } as AccountingReport
  const groups = reportSections(report, transactionIdsByAccount)

  if (name === 'ProfitAndLoss') {
    const income = groups.filter(({ key }) => key === 'income' || key === 'otherincome')
    const expenses = groups.filter(({ key }) => key === 'expenses' || key === 'otherexpenses')
    const cogs = groups.filter(
      ({ key }) =>
        key.includes('costofgoods') || key.includes('costofsales') || key.includes('cogs'),
    )
    const ordinaryIncome = groups.find(({ key }) => key === 'income')
    const ordinaryExpenses = groups.find(({ key }) => key === 'expenses')
    const namedSections = (
      matches: ReportSection[],
      type: 'cogs' | 'expenses' | 'income',
    ): Array<Record<string, any>> =>
      matches.flatMap((match) =>
        pnlSections([match], type).map((section) => ({
          ...section,
          sectionName:
            match.key === 'otherincome'
              ? 'Other Income/Expense - Other Income'
              : match.key === 'otherexpenses'
                ? 'Other Income/Expense - Other Expense'
                : type === 'income'
                  ? 'Ordinary Income/Expenses - Income'
                  : type === 'expenses'
                    ? 'Ordinary Income/Expenses - Expenses'
                    : 'Ordinary Income/Expenses - Cost of Goods Sold',
        })),
      )

    return {
      ...base,
      costOfGoodsSoldSections: namedSections(cogs, 'cogs'),
      costOfGoodsSoldTotalAmount: cogs[0]?.item.amount || undefined,
      expensesSections: namedSections(expenses, 'expenses'),
      expensesTotalAmount: ordinaryExpenses?.item.amount || undefined,
      incomeSections: namedSections(income, 'income'),
      incomeTotalAmount:
        ordinaryIncome?.item.amount ?? groups.find(({ key }) => key === 'otherincome')?.item.amount,
      netIncomeAmount: groups.find(({ key }) => key.includes('netincome'))?.item.amount,
    }
  }

  if (name === 'BalanceSheet') {
    const assetsRoot = groups.find(({ key }) => key === 'assets' || key === 'totalassets')?.item
    const liabilitiesAndEquity = groups.find(
      ({ key }) => key === 'liabilitiesandequity' || key === 'totalliabilitiesandequity',
    )?.item
    const liabilitiesRoot = liabilitiesAndEquity?.subItems?.find(
      (item: Record<string, any>) => reportKey(item.name) === 'liabilities',
    )
    const equityRoot = liabilitiesAndEquity?.subItems?.find(
      (item: Record<string, any>) => reportKey(item.name) === 'equity',
    )

    return {
      ...base,
      assets: assetsRoot?.subItems ?? [],
      equity: equityRoot?.subItems ?? [],
      liabilities: liabilitiesRoot?.subItems ?? [],
      netAssetsAmount:
        groups.find(({ key }) => key === 'liabilitiesandequity')?.item.amount ??
        groups.find(({ key }) => key.includes('totalliabilitiesandequity'))?.item.amount,
    }
  }

  if (name === 'CashFlow') {
    const cashSections = (match: string, sectionName: string): Array<Record<string, any>> =>
      groups
        .filter(({ key }) => key.includes(match))
        .map(({ item }) => ({
          items: item.subItems ?? [],
          sectionName,
          totalAmount: item.amount,
        }))
    const cashBeginningAmount = groups.find(({ key }) => key.includes('beginningcash'))?.item.amount
    const cashEndingAmount = groups.find(({ key }) => key.includes('endingcash'))?.item.amount

    return {
      ...base,
      cashBeginningAmount,
      cashEndingAmount,
      financingSections: cashSections('financing', 'Financing Activities'),
      investingSections: cashSections('investing', 'Investing Activities'),
      netChangeInCashAmount:
        groups.find(({ key }) => key.includes('netchange') || key.includes('netcashincrease'))?.item
          .amount ??
        (cashBeginningAmount !== undefined && cashEndingAmount !== undefined
          ? Number((Number(cashEndingAmount) - Number(cashBeginningAmount)).toFixed(2))
          : undefined),
      operatingSections: cashSections('operating', 'Operating Activities'),
    }
  }

  if (name === 'TrialBalance') {
    const rows = report.Rows?.Row ?? []
    const subItems = rows.flatMap((row: Record<string, any>) => {
      if (row.type === 'Section' || row.group) {
        return []
      }

      const columns = row.ColData ?? row.Summary?.ColData ?? []

      if (!columns[0]?.value) {
        return []
      }

      return [
        {
          accountId: columns[0]?.id,
          accountName: columns[0]?.value,
          amount: numeric(columns[2]?.value) - numeric(columns[1]?.value),
        },
      ]
    })
    const grandTotalRow = rows.find(
      (row: Record<string, any>) => reportKey(row.group) === 'grandtotal',
    )
    const grandTotal = report.Rows?.GrandTotal?.ColData ?? grandTotalRow?.Summary?.ColData ?? []

    return {
      ...base,
      subItems,
      totalCreditAmount: numeric(grandTotal[2]?.value),
      totalDebitAmount: numeric(grandTotal[1]?.value),
    }
  }

  return base
}
