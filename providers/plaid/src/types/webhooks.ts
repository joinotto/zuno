// SPDX-License-Identifier: Apache-2.0

import type { PlaidApiErrorBody, PlaidEnvironment, PlaidRecord } from '../types.js'

export interface PlaidWebhook extends PlaidRecord {
  environment?: PlaidEnvironment
  item_id?: string
  webhook_code: string
  webhook_type: string
}

export interface PlaidItemWebhook extends PlaidWebhook {
  error?: PlaidApiErrorBody | null
  item_id: string
  new_transactions?: number
  webhook_code:
    | 'ERROR'
    | 'NEW_ACCOUNTS_AVAILABLE'
    | 'PENDING_EXPIRATION'
    | 'USER_PERMISSION_REVOKED'
    | 'WEBHOOK_UPDATE_ACKNOWLEDGED'
  webhook_type: 'ITEM'
}

export interface PlaidTransactionsWebhook extends PlaidWebhook {
  account_id?: string
  initial_update_complete?: boolean
  item_id: string
  new_transactions?: number
  removed_transactions?: string[]
  webhook_code:
    | 'DEFAULT_UPDATE'
    | 'HISTORICAL_UPDATE'
    | 'INITIAL_UPDATE'
    | 'RECURRING_TRANSACTIONS_UPDATE'
    | 'SYNC_UPDATES_AVAILABLE'
    | 'TRANSACTIONS_REMOVED'
  webhook_type: 'TRANSACTIONS'
}

export interface PlaidInvestmentsWebhook extends PlaidWebhook {
  item_id: string
  new_holdings?: number
  new_investments_transactions?: number
  webhook_code: 'DEFAULT_UPDATE' | 'HOLDINGS_UPDATE'
  webhook_type: 'INVESTMENTS_TRANSACTIONS'
}

export interface PlaidStatementsWebhook extends PlaidWebhook {
  item_id: string
  request_id?: string
  status?: string
  webhook_code: 'STATEMENTS_REFRESH_COMPLETE'
  webhook_type: 'STATEMENTS'
}

export interface PlaidAssetsWebhook extends PlaidWebhook {
  asset_report_id?: string
  error?: PlaidApiErrorBody | null
  webhook_code: 'ERROR' | 'PRODUCT_READY'
  webhook_type: 'ASSETS'
}

export type PlaidKnownWebhook =
  | PlaidAssetsWebhook
  | PlaidInvestmentsWebhook
  | PlaidItemWebhook
  | PlaidStatementsWebhook
  | PlaidTransactionsWebhook
