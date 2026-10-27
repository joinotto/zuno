// SPDX-License-Identifier: Apache-2.0

import type { PlaidPersonalFinanceCategory, PlaidRecord, PlaidResponse } from '../types.js'
import type { PlaidTransactionCounterparty, PlaidTransactionLocation } from './transactions.js'

export type PlaidEnrichDirection = 'INFLOW' | 'OUTFLOW'
export type PlaidEnrichAccountType = 'credit' | 'depository'

export interface PlaidEnrichTransactionInput extends PlaidRecord {
  amount: number
  description: string
  direction: PlaidEnrichDirection
  id: string
  iso_currency_code: string
  location?: Partial<PlaidTransactionLocation>
}

export interface TransactionsEnrichRequest {
  account_type: PlaidEnrichAccountType
  options?: {
    include_legacy_category?: boolean
    personal_finance_category_version?: 'v1' | 'v2'
  }
  transactions: PlaidEnrichTransactionInput[]
}

export interface PlaidTransactionEnrichments extends PlaidRecord {
  counterparties: PlaidTransactionCounterparty[]
  entity_id?: string | null
  location: PlaidTransactionLocation
  logo_url?: string | null
  merchant_name: string | null
  payment_channel: string
  personal_finance_category?: PlaidPersonalFinanceCategory | null
  personal_finance_category_icon_url?: string | null
  phone_number?: string | null
  website?: string | null
}

export interface PlaidEnrichedTransaction extends PlaidEnrichTransactionInput {
  enrichments: PlaidTransactionEnrichments
}

export interface TransactionsEnrichResponse extends PlaidResponse {
  enriched_transactions: PlaidEnrichedTransaction[]
}
