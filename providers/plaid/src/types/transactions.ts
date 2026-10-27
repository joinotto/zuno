// SPDX-License-Identifier: Apache-2.0

import type {
  PlaidAccount,
  PlaidPersonalFinanceCategory,
  PlaidRecord,
  PlaidResponse,
  PlaidTransaction,
} from '../types.js'

export interface PlaidTransactionLocation extends PlaidRecord {
  address: string | null
  city: string | null
  country: string | null
  lat: number | null
  lon: number | null
  postal_code: string | null
  region: string | null
  store_number: string | null
}

export interface PlaidTransactionCounterparty extends PlaidRecord {
  confidence_level?: string
  entity_id?: string | null
  logo_url?: string | null
  name: string
  phone_number?: string | null
  type: string
  website?: string | null
}

export interface PlaidTransactionPaymentMeta extends PlaidRecord {
  by_order_of: string | null
  payee: string | null
  payer: string | null
  payment_method: string | null
  payment_processor: string | null
  ppd_id: string | null
  reason: string | null
  reference_number: string | null
}

export interface TransactionsRecurringGetRequest {
  access_token: string
  account_ids?: string[]
  options?: {
    personal_finance_category_version?: 'v1' | 'v2'
  }
}

export type PlaidRecurringFrequency =
  'ANNUALLY' | 'BIWEEKLY' | 'MONTHLY' | 'SEMI_MONTHLY' | 'UNKNOWN' | 'WEEKLY'

export type PlaidRecurringStatus = 'EARLY_DETECTION' | 'MATURE' | 'TOMBSTONED' | 'UNKNOWN'

export interface PlaidRecurringAmount extends PlaidRecord {
  amount: number
  iso_currency_code?: string | null
  unofficial_currency_code?: string | null
}

export interface PlaidRecurringStream extends PlaidRecord {
  account_id: string
  average_amount: PlaidRecurringAmount
  description: string
  first_date: string
  frequency: PlaidRecurringFrequency
  is_active: boolean
  is_user_modified: boolean
  last_amount: PlaidRecurringAmount
  last_date: string
  merchant_name: string | null
  personal_finance_category?: PlaidPersonalFinanceCategory | null
  predicted_next_date: string | null
  status: PlaidRecurringStatus
  stream_id: string
  transaction_ids: string[]
}

export interface TransactionsRecurringGetResponse extends PlaidResponse {
  inflow_streams: PlaidRecurringStream[]
  outflow_streams: PlaidRecurringStream[]
  updated_datetime: string
}

export interface TransactionsGetRequest {
  access_token: string
  end_date: string
  options?: {
    account_ids?: string[]
    count?: number
    include_original_description?: boolean
    offset?: number
    personal_finance_category_version?: 'v1' | 'v2'
  }
  start_date: string
}

export interface TransactionsGetResponse extends PlaidResponse {
  accounts: PlaidAccount[]
  item: PlaidRecord
  total_transactions: number
  transactions: PlaidTransaction[]
}

export interface TransactionsGetAllResult {
  accounts: PlaidAccount[]
  item: PlaidRecord
  request_ids: string[]
  total_transactions: number
  transactions: PlaidTransaction[]
}
