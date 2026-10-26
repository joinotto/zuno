// SPDX-License-Identifier: Apache-2.0

export { QuickBooksClient } from './client.js'
export { quickBooksManifest } from './manifest.js'
export { QuickBooksOAuth } from './oauth.js'
export {
  collectDeletedTransactionIds,
  contactToQuickBooks,
  decodeContactId,
  encodeContactId,
  encodeTransactionLegId,
  getTransactionReportDiagnostics,
  mapAccount,
  mapCategory,
  mapContact,
  mapGeneralLedgerTransactionIdsByAccount,
  mapNativeTransaction,
  mapReport,
  mapTransactionReport,
  QuickBooksAccountingClient,
} from './compatibility/index.js'
export type {
  QuickBooksClientOptions,
  QuickBooksCompanyInfo,
  QuickBooksEnvironment,
  QuickBooksOAuthConfig,
  QuickBooksRecord,
  QuickBooksTokenSet,
} from './types.js'
export type { QuickBooksManifest } from './manifest.js'
export type {
  AccountQueryParams,
  AccountingAccount,
  AccountingAddress,
  AccountingCategory,
  AccountingContact,
  AccountingReport,
  AccountingTransaction,
  CategoryQueryParams,
  ContactQueryParams,
  QuickBooksAccountingClientOptions,
  QuickBooksAccountingLogger,
  ReportQueryParams,
  ReportSummarizeBy,
  TransactionLegType,
  TransactionQueryParams,
} from './compatibility/index.js'
