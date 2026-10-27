// SPDX-License-Identifier: Apache-2.0

import type { PlaidRecord, PlaidResponse } from '../types.js'

export interface PlaidAssetReportUser extends PlaidRecord {
  client_user_id?: string
  email?: string
  first_name?: string
  last_name?: string
  middle_name?: string
  phone_number?: string
  ssn?: string
}

export interface PlaidAssetReportOptions extends PlaidRecord {
  add_ons?: ('fast_assets' | 'investments' | (string & {}))[]
  client_report_id?: string
  fail_on_item_errors?: boolean
  user?: PlaidAssetReportUser
  webhook?: string
}

export interface AssetReportCreateRequest {
  access_tokens: string[]
  days_requested: number
  options?: PlaidAssetReportOptions
}

export interface AssetReportTokenResponse extends PlaidResponse {
  asset_report_id: string
  asset_report_token: string
}

export interface AssetReportGetRequest {
  asset_report_token: string
  fast_report?: boolean
  include_insights?: boolean
  options?: {
    days_requested?: number
  }
}

export interface AssetReportGetResponse extends PlaidResponse {
  report: PlaidRecord
  warnings: PlaidRecord[]
}

export interface AssetReportPdfGetRequest {
  asset_report_token: string
  options?: {
    days_requested?: number
  }
}

export interface AssetReportRefreshRequest {
  asset_report_token: string
  days_requested?: number
  options?: PlaidAssetReportOptions
}

export interface AssetReportFilterRequest {
  account_ids_to_exclude: string[]
  asset_report_token: string
}

export interface AssetReportRemoveRequest {
  asset_report_token: string
}

export interface AssetReportRemoveResponse extends PlaidResponse {
  removed: boolean
}

export interface AssetReportAuditCopyCreateRequest {
  asset_report_token: string
  auditor_id: string
}

export interface AssetReportAuditCopyCreateResponse extends PlaidResponse {
  audit_copy_token: string
}

export interface AssetReportAuditCopyRemoveRequest {
  audit_copy_token: string
}

export interface AssetReportAuditCopyRemoveResponse extends PlaidResponse {
  removed: boolean
}
