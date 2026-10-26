// SPDX-License-Identifier: Apache-2.0

export { collectDeletedTransactionIds, QuickBooksAccountingClient } from './client.js'
export type { QuickBooksAccountingClientOptions, QuickBooksAccountingLogger } from './client.js'
export {
  contactToQuickBooks,
  decodeContactId,
  encodeContactId,
  getTransactionReportDiagnostics,
  mapAccount,
  mapCategory,
  mapContact,
  mapGeneralLedgerTransactionIdsByAccount,
  mapNativeTransaction,
  mapReport,
  mapTransactionReport,
} from './qbo-mapper/index.js'
export { encodeTransactionLegId } from './qbo-mapper/transaction-id.js'
export type { TransactionLegType } from './qbo-mapper/transaction-id.js'
export type * from './types.js'
