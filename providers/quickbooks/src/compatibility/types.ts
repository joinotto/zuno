// SPDX-License-Identifier: Apache-2.0

export interface AccountingAddress {
  [key: string]: unknown
  addressLine1?: string
  addressLine2?: string
  city?: string
  country?: string
  postalCode?: string
  state?: string
}

export interface AccountingAccount {
  [key: string]: unknown
  balance?: number
  createdAt?: Date
  currency?: string
  customerDefinedCode?: string
  description?: string
  id?: string
  isPayable?: boolean
  name?: string
  organizationId?: string
  parentId?: string
  raw?: Record<string, any>
  status?: 'ACTIVE' | 'ARCHIVED' | string
  taxonomy?: Array<{
    originalType?: string
    type: string
    value: string
  }>
  type?: string
  updatedAt?: Date
}

export interface AccountingCategory {
  [key: string]: unknown
  code?: string
  createdAt?: Date
  description?: string
  id?: string
  isActive?: boolean
  metadata?: Array<{ key?: string; value?: string }>
  name?: string
  organizationId?: string
  parentId?: string
  raw?: Record<string, any>
  type?: string
  updatedAt?: Date
}

export interface AccountingContact {
  [key: string]: unknown
  associatedContacts?: Array<Record<string, unknown>>
  balanceAmount?: number
  billingAddress?: AccountingAddress
  companyName?: string
  createdAt?: Date
  currency?: string
  emails?: Array<{ email?: string; type?: string }>
  firstName?: string
  id?: string
  identification?: string
  isActive?: boolean
  isCustomer?: boolean
  isSupplier?: boolean
  lastName?: string
  name?: string
  notes?: string
  organizationId?: string
  paymentMethods?: Array<Record<string, unknown>>
  paymentTerms?: string
  paymenttermId?: string
  portalUrl?: string
  raw?: Record<string, any>
  shippingAddress?: AccountingAddress
  taxExemption?: string
  taxNumber?: string
  telephones?: Array<{ telephone?: string; type?: string }>
  updatedAt?: Date
  website?: string
}

export interface AccountingTransaction {
  [key: string]: unknown
  accountId?: string
  categoryIds?: string[]
  contacts?: Array<{ id: string; isCustomer?: boolean; isSupplier?: boolean }>
  createdAt?: Date
  currency?: string
  customerMessage?: string
  exchangeRate?: number
  id?: string
  lineitems?: Array<{
    accountId?: string
    description?: string
    id?: string
    totalAmount?: number
    unitAmount?: number
  }>
  memo?: string
  organizationId?: string
  paymentMethod?: string
  paymentTerms?: string
  projectId?: string
  raw?: Record<string, any>
  reference?: string
  splitAccountId?: string
  status?: 'OTHER' | 'PENDING' | 'POSTED' | 'VOID' | string
  subTotalAmount?: number
  taxAmount?: number
  totalAmount?: number
  transactionAt?: Date
  type?: string
  updatedAt?: Date
}

export interface ReportQueryParams {
  endLt?: string
  limit?: number
  offset?: number
  order?: string
  query?: string
  sort?: string
  startGte?: string
  updatedGte?: string
}

export interface AccountQueryParams {
  limit?: number
  offset?: number
  order?: string
  query?: string
  sort?: string
  updatedGte?: string
}

export interface TransactionQueryParams extends AccountQueryParams {
  accountId?: string
  contactId?: string
  endLt?: string
  startGte?: string
}

export interface CategoryQueryParams extends AccountQueryParams {
  parentId?: string
}

export interface ContactQueryParams extends AccountQueryParams {
  orgId?: string
  type?: 'CUSTOMER' | 'SUPPLIER'
}

export type ReportSummarizeBy = 'month' | 'quarter' | 'total' | 'year'

export type AccountingReport = Record<string, any> & {
  assets?: Array<Record<string, any>>
  cashBeginningAmount?: number
  cashEndingAmount?: number
  categoryIds?: string[]
  contactId?: string
  costOfGoodsSoldSections?: Array<Record<string, any>>
  costOfGoodsSoldTotalAmount?: number
  createdAt?: Date
  currency?: string
  endAt?: Date
  equity?: Array<Record<string, any>>
  expensesSections?: Array<Record<string, any>>
  expensesTotalAmount?: number
  financingSections?: Array<Record<string, any>>
  id?: string
  incomeSections?: Array<Record<string, any>>
  incomeTotalAmount?: number
  investingSections?: Array<Record<string, any>>
  liabilities?: Array<Record<string, any>>
  name?: string
  netAssetsAmount?: number
  netChangeInCashAmount?: number
  netIncomeAmount?: number
  operatingSections?: Array<Record<string, any>>
  raw?: Record<string, any>
  startAt?: Date
  subItems?: Array<Record<string, any>>
  totalCreditAmount?: number
  totalDebitAmount?: number
  updatedAt?: Date
}
