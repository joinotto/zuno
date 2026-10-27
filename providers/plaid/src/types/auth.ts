// SPDX-License-Identifier: Apache-2.0

import type { PlaidAccount, PlaidItem, PlaidRecord, PlaidResponse } from '../types.js'

export interface AuthGetRequest {
  access_token: string
  options?: {
    account_ids?: string[]
  }
}

export interface PlaidAchNumber extends PlaidRecord {
  account: string
  account_id: string
  is_tokenized_account_number?: boolean
  routing: string
  wire_routing: string | null
}

export interface PlaidEftNumber extends PlaidRecord {
  account: string
  account_id: string
  branch: string
  institution: string
}

export interface PlaidInternationalNumber extends PlaidRecord {
  account_id: string
  bic: string
  iban: string
}

export interface PlaidBacsNumber extends PlaidRecord {
  account: string
  account_id: string
  sort_code: string
}

export interface PlaidAuthNumbers extends PlaidRecord {
  ach: PlaidAchNumber[]
  bacs: PlaidBacsNumber[]
  eft: PlaidEftNumber[]
  international: PlaidInternationalNumber[]
}

export interface AuthGetResponse extends PlaidResponse {
  accounts: PlaidAccount[]
  item: PlaidItem
  numbers: PlaidAuthNumbers
}
