// SPDX-License-Identifier: Apache-2.0

import { AuthenticationError, createTransport, ProviderApiError } from '@ottoai/zuno'
import type { Transport } from '@ottoai/zuno'
import type { QuickBooksClientOptions, QuickBooksCompanyInfo, QuickBooksRecord } from './types.js'

const productionBaseUrl = 'https://quickbooks.api.intuit.com'
const sandboxBaseUrl = 'https://sandbox-quickbooks.api.intuit.com'

export class QuickBooksClient {
  readonly #getAccessToken: QuickBooksClientOptions['getAccessToken']
  readonly #minorVersion: string
  readonly #options: QuickBooksClientOptions

  constructor(options: QuickBooksClientOptions) {
    this.#options = options
    this.#getAccessToken = options.getAccessToken
    this.#minorVersion = options.minorVersion ?? '75'
  }

  get minorVersion(): string {
    return this.#minorVersion
  }

  get realmId(): string {
    return this.#options.realmId
  }

  async getCompanyInfo(): Promise<QuickBooksCompanyInfo> {
    const payload = await this.request<QuickBooksRecord>(
      `/v3/company/${this.realmId}/companyinfo/${this.realmId}`,
      {},
      'company.get',
    )
    const company =
      asRecord(payload.CompanyInfo) ?? firstRecord(asRecord(payload.QueryResponse)?.CompanyInfo)

    if (company === undefined) {
      throw new ProviderApiError('QuickBooks company information was missing.', {
        body: payload,
        operation: 'company.get',
        provider: 'quickbooks',
        status: 502,
      })
    }

    const name = optionalString(company.CompanyName)

    return {
      id: optionalString(company.Id) ?? this.realmId,
      raw: company,
      ...(name === undefined ? {} : { name }),
    }
  }

  async request<T>(path: string, init: RequestInit = {}, operation = 'request'): Promise<T> {
    for (const forceRefresh of [false, true]) {
      const accessToken = await this.#getAccessToken(forceRefresh)
      const transport = this.#createTransport(accessToken)

      try {
        return await transport.request<T>({
          init,
          operation,
          path,
        })
      } catch (error) {
        if (error instanceof AuthenticationError && !forceRefresh) {
          continue
        }

        throw error
      }
    }

    throw new AuthenticationError('QuickBooks authentication failed.', {
      operation,
      provider: 'quickbooks',
      status: 401,
    })
  }

  companyPath(path: string): string {
    return `/v3/company/${this.realmId}/${path.replace(/^\/+/u, '')}`
  }

  withMinorVersion(path: string): string {
    const url = new URL(path, 'https://quickbooks.invalid')
    url.searchParams.set('minorversion', this.minorVersion)
    return `${url.pathname}${url.search}`
  }

  #createTransport(accessToken: string): Transport {
    return createTransport({
      baseUrl: this.#options.environment === 'production' ? productionBaseUrl : sandboxBaseUrl,
      defaultHeaders: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      provider: 'quickbooks',
      ...(this.#options.fetch === undefined ? {} : { fetch: this.#options.fetch }),
      ...(this.#options.hooks === undefined ? {} : { hooks: this.#options.hooks }),
      ...(this.#options.retry === undefined ? {} : { retry: this.#options.retry }),
      ...(this.#options.timeoutMs === undefined ? {} : { timeoutMs: this.#options.timeoutMs }),
    })
  }
}

function asRecord(value: unknown): QuickBooksRecord | undefined {
  return typeof value === 'object' && value !== null ? (value as QuickBooksRecord) : undefined
}

function firstRecord(value: unknown): QuickBooksRecord | undefined {
  return Array.isArray(value) ? asRecord(value[0]) : undefined
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : undefined
}
