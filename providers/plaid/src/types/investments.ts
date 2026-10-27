// SPDX-License-Identifier: Apache-2.0

import type { PlaidAccount, PlaidItem, PlaidRecord, PlaidResponse } from '../types.js'

export interface InvestmentsHoldingsGetRequest {
  access_token: string
  options?: {
    account_ids?: string[]
  }
}

export interface PlaidInvestmentHolding extends PlaidRecord {
  account_id: string
  cost_basis: number | null
  institution_price: number
  institution_price_as_of: string | null
  institution_price_datetime?: string | null
  institution_value: number
  iso_currency_code: string | null
  quantity: number
  security_id: string
  unofficial_currency_code: string | null
  vested_quantity?: number | null
  vested_value?: number | null
}

export interface PlaidSecurity extends PlaidRecord {
  close_price: number | null
  close_price_as_of: string | null
  close_price_datetime?: string | null
  cusip: string | null
  institution_id: string | null
  institution_security_id: string | null
  isin: string | null
  iso_currency_code: string | null
  name: string | null
  proxy_security_id: string | null
  security_id: string
  sedol: string | null
  subtype?: string | null
  ticker_symbol: string | null
  type: string | null
  unofficial_currency_code: string | null
  update_datetime: string | null
}

export interface InvestmentsHoldingsGetResponse extends PlaidResponse {
  accounts: PlaidAccount[]
  holdings: PlaidInvestmentHolding[]
  item: PlaidItem
  securities: PlaidSecurity[]
}

export interface InvestmentsTransactionsGetRequest {
  access_token: string
  end_date: string
  options?: {
    account_ids?: string[]
    async_update?: boolean
    count?: number
    offset?: number
  }
  start_date: string
}

export interface PlaidInvestmentTransaction extends PlaidRecord {
  account_id: string
  amount: number
  cancel_transaction_id: string | null
  date: string
  fees: number | null
  investment_transaction_id: string
  iso_currency_code: string | null
  name: string
  price: number
  quantity: number
  security_id: string | null
  subtype: string
  transaction_datetime?: string | null
  type: 'buy' | 'cancel' | 'cash' | 'fee' | 'sell' | 'transfer' | (string & {})
  unofficial_currency_code: string | null
}

export interface InvestmentsTransactionsGetResponse extends PlaidResponse {
  accounts: PlaidAccount[]
  investment_transactions: PlaidInvestmentTransaction[]
  item: PlaidItem
  securities: PlaidSecurity[]
  total_investment_transactions: number
}

export interface InvestmentsTransactionsGetAllResult extends Omit<
  InvestmentsTransactionsGetResponse,
  'request_id'
> {
  request_ids: string[]
}

export interface InvestmentsRefreshRequest {
  access_token: string
}
