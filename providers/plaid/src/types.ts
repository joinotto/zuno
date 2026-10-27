// SPDX-License-Identifier: Apache-2.0

import type { RetryPolicy, TransportHooks } from '@ottoai/zuno'

export type PlaidEnvironment = 'development' | 'production' | 'sandbox'
export type PlaidRecord = Record<string, unknown>
export type PlaidProduct =
  | 'assets'
  | 'auth'
  | 'employment'
  | 'identity'
  | 'identity_verification'
  | 'income_verification'
  | 'investments'
  | 'investments_auth'
  | 'liabilities'
  | 'payment_initiation'
  | 'signal'
  | 'statements'
  | 'transactions'
  | 'transfer'
  | (string & {})
export type PlaidCountryCode =
  | 'AT'
  | 'BE'
  | 'CA'
  | 'DE'
  | 'DK'
  | 'EE'
  | 'ES'
  | 'FI'
  | 'FR'
  | 'GB'
  | 'IE'
  | 'IT'
  | 'LT'
  | 'LV'
  | 'NL'
  | 'NO'
  | 'PL'
  | 'PT'
  | 'SE'
  | 'US'
  | (string & {})

export interface PlaidClientOptions {
  clientId: string
  environment: PlaidEnvironment
  fetch?: typeof globalThis.fetch
  hooks?: TransportHooks
  retry?: Partial<RetryPolicy>
  secret: string
  timeoutMs?: number
  version?: string
}

export interface PlaidResponse {
  request_id: string
}

export interface PlaidApiErrorBody extends PlaidRecord {
  display_message?: string | null
  error_code?: string
  error_code_reason?: string
  error_message?: string
  error_type?: string
  request_id?: string
}

export interface PlaidLinkUser extends PlaidRecord {
  client_user_id?: string
  email_address?: string
  legal_name?: string
  phone_number?: string
}

export interface LinkTokenCreateRequest extends PlaidRecord {
  access_token?: string
  additional_consented_products?: PlaidProduct[]
  client_name: string
  country_codes: PlaidCountryCode[]
  language: string
  optional_products?: PlaidProduct[]
  products?: PlaidProduct[]
  redirect_uri?: string
  required_if_supported_products?: PlaidProduct[]
  transactions?: {
    days_requested?: number
  }
  user?: PlaidLinkUser
  user_id?: string
  user_token?: string
  webhook?: string
}

export interface LinkTokenCreateResponse extends PlaidResponse {
  expiration: string
  hosted_link_url?: string
  link_token: string
  user_id?: string
}

export interface LinkTokenGetRequest {
  link_token: string
}

export interface LinkTokenGetResponse extends PlaidRecord, PlaidResponse {
  created_at: string
  expiration: string
  link_sessions: PlaidRecord[]
  link_token: string
}

export interface ItemPublicTokenExchangeRequest {
  public_token: string
}

export interface ItemPublicTokenExchangeResponse extends PlaidResponse {
  access_token: string
  item_id: string
}

export interface PlaidItem extends PlaidRecord {
  available_products: PlaidProduct[]
  billed_products: PlaidProduct[]
  consent_expiration_time?: string | null
  error: PlaidApiErrorBody | null
  institution_id: string | null
  institution_name?: string
  item_id: string
  products: PlaidProduct[]
  update_type: 'background' | 'user_present_required' | (string & {})
  webhook: string
}

export interface ItemGetRequest {
  access_token: string
}

export interface ItemGetResponse extends PlaidResponse {
  item: PlaidItem
  status: PlaidRecord
}

export interface ItemRemoveRequest {
  access_token: string
  reason?: string
  reason_note?: string
}

export interface ItemWebhookUpdateRequest {
  access_token: string
  webhook: string | null
}

export interface ItemWebhookUpdateResponse extends PlaidResponse {
  item: PlaidItem
}

export interface ItemAccessTokenInvalidateRequest {
  access_token: string
}

export interface ItemAccessTokenInvalidateResponse extends PlaidResponse {
  new_access_token: string
}

export interface PlaidAccountBalances extends PlaidRecord {
  available: number | null
  current: number | null
  iso_currency_code: string | null
  last_updated_datetime?: string | null
  limit: number | null
  unofficial_currency_code: string | null
}

export interface PlaidAccount extends PlaidRecord {
  account_id: string
  balances: PlaidAccountBalances
  mask: string | null
  name: string
  official_name: string | null
  persistent_account_id?: string
  subtype: string | null
  type: string
}

export interface AccountsGetRequest {
  access_token: string
  options?: {
    account_ids?: string[]
  }
}

export interface AccountsGetResponse extends PlaidResponse {
  accounts: PlaidAccount[]
  item: PlaidItem
}

export interface PlaidPersonalFinanceCategory extends PlaidRecord {
  confidence_level?: string
  detailed: string
  primary: string
  version?: 'v1' | 'v2'
}

export interface PlaidTransaction extends PlaidRecord {
  account_id: string
  amount: number
  authorized_date?: string | null
  authorized_datetime?: string | null
  date: string
  datetime?: string | null
  iso_currency_code: string | null
  merchant_name: string | null
  name: string
  payment_channel: string
  pending: boolean
  pending_transaction_id: string | null
  personal_finance_category?: PlaidPersonalFinanceCategory | null
  transaction_id: string
  unofficial_currency_code: string | null
}

export interface PlaidRemovedTransaction {
  account_id: string
  transaction_id: string
}

export interface TransactionsSyncRequest {
  access_token: string
  count?: number
  cursor?: string
  options?: {
    account_id?: string
    days_requested?: number
    include_original_description?: boolean
    personal_finance_category_version?: 'v1' | 'v2'
  }
}

export interface TransactionsSyncResponse extends PlaidResponse {
  accounts: PlaidAccount[]
  added: PlaidTransaction[]
  has_more: boolean
  modified: PlaidTransaction[]
  next_cursor: string
  removed: PlaidRemovedTransaction[]
  transactions_update_status?: string
}

export interface TransactionsSyncResult {
  accounts: PlaidAccount[]
  added: PlaidTransaction[]
  modified: PlaidTransaction[]
  next_cursor: string
  removed: PlaidRemovedTransaction[]
  request_ids: string[]
  transactions_update_status?: string
}

export interface TransactionsRefreshRequest {
  access_token: string
}

export interface IdentityGetRequest {
  access_token: string
  options?: {
    account_ids?: string[]
  }
}

export interface IdentityGetResponse extends PlaidRecord, PlaidResponse {
  accounts: PlaidRecord[]
  item: PlaidItem
}

export interface LiabilitiesGetRequest {
  access_token: string
}

export interface LiabilitiesGetResponse extends PlaidRecord, PlaidResponse {
  accounts: PlaidAccount[]
  item: PlaidItem
  liabilities: PlaidRecord
}

export interface InstitutionGetByIdRequest {
  country_codes: PlaidCountryCode[]
  institution_id: string
  options?: PlaidRecord
}

export interface InstitutionSearchRequest extends PlaidRecord {
  country_codes: PlaidCountryCode[]
  products?: PlaidProduct[]
  query: string
}

export interface PlaidInstitution extends PlaidRecord {
  country_codes: PlaidCountryCode[]
  institution_id: string
  name: string
  products: PlaidProduct[]
}

export interface InstitutionGetByIdResponse extends PlaidResponse {
  institution: PlaidInstitution
}

export interface InstitutionSearchResponse extends PlaidResponse {
  institutions: PlaidInstitution[]
}

export interface WebhookVerificationKeyGetRequest {
  key_id: string
}

export interface PlaidWebhookVerificationKey extends PlaidRecord {
  alg: 'ES256'
  crv: 'P-256'
  expired_at: number | null
  kid: string
  kty: 'EC'
  use: 'sig'
  x: string
  y: string
}

export interface WebhookVerificationKeyGetResponse extends PlaidResponse {
  key: PlaidWebhookVerificationKey
}

export interface PlaidWebhook extends PlaidRecord {
  environment?: PlaidEnvironment
  item_id?: string
  webhook_code: string
  webhook_type: string
}
