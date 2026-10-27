// SPDX-License-Identifier: Apache-2.0

import type { PlaidProduct, PlaidResponse } from '../types.js'

export interface ProcessorTokenCreateRequest {
  access_token: string
  account_id: string
  processor: string
}

export interface ProcessorTokenCreateResponse extends PlaidResponse {
  processor_token: string
}

export interface ProcessorStripeBankAccountTokenCreateRequest {
  access_token: string
  account_id: string
}

export interface ProcessorStripeBankAccountTokenCreateResponse extends PlaidResponse {
  stripe_bank_account_token: string
}

export interface ProcessorTokenPermissionsSetRequest {
  processor_token: string
  products: PlaidProduct[]
}
