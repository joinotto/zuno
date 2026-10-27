// SPDX-License-Identifier: Apache-2.0

import type { PlaidRecord, PlaidResponse } from '../types.js'

export interface StatementsListRequest {
  access_token: string
}

export interface PlaidStatement extends PlaidRecord {
  date_posted: string
  month: number
  statement_id: string
  year: number
}

export interface PlaidStatementAccount extends PlaidRecord {
  account_id: string
  account_mask: string | null
  account_name: string
  account_official_name: string | null
  account_subtype: string | null
  account_type: string
  statements: PlaidStatement[]
}

export interface StatementsListResponse extends PlaidResponse {
  accounts: PlaidStatementAccount[]
  institution_id: string
  institution_name: string
  item_id: string
}

export interface StatementsDownloadRequest {
  access_token: string
  statement_id: string
}

export interface StatementsRefreshRequest {
  access_token: string
  end_date: string
  start_date: string
}
