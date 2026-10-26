// SPDX-License-Identifier: Apache-2.0

import { AuthenticationError, ProviderApiError } from '@ottoai/zuno'
import { describe, expect, it } from 'vitest'
import { QuickBooksClient } from '../src/client.js'

describe('QuickBooksClient', () => {
  it('uses the sandbox URL and returns company information', async () => {
    const requests: Request[] = []
    const client = new QuickBooksClient({
      environment: 'sandbox',
      fetch: async (input, init) => {
        requests.push(new Request(input, init))
        return Response.json({
          CompanyInfo: {
            CompanyName: 'Zuno Test Company',
            Id: 'realm-1',
          },
        })
      },
      getAccessToken: async () => 'access-token',
      realmId: 'realm-1',
    })

    await expect(client.getCompanyInfo()).resolves.toMatchObject({
      id: 'realm-1',
      name: 'Zuno Test Company',
    })
    expect(requests[0]?.url).toBe(
      'https://sandbox-quickbooks.api.intuit.com/v3/company/realm-1/companyinfo/realm-1',
    )
    expect(requests[0]?.headers.get('authorization')).toBe('Bearer access-token')
  })

  it('refreshes the token once after an unauthorized response', async () => {
    const refreshRequests: boolean[] = []
    const authorizationHeaders: string[] = []
    let requests = 0
    const client = new QuickBooksClient({
      environment: 'production',
      fetch: async (input, init) => {
        requests += 1
        const request = new Request(input, init)
        authorizationHeaders.push(request.headers.get('authorization') ?? '')
        return requests === 1
          ? Response.json({ fault: 'expired' }, { status: 401 })
          : Response.json({ QueryResponse: { Account: [] } })
      },
      getAccessToken: async (forceRefresh) => {
        refreshRequests.push(forceRefresh ?? false)
        return forceRefresh === true ? 'new-token' : 'old-token'
      },
      realmId: 'realm-1',
      retry: { baseDelayMs: 0, maxAttempts: 1 },
    })

    await expect(client.request('/query')).resolves.toEqual({
      QueryResponse: { Account: [] },
    })
    expect(refreshRequests).toEqual([false, true])
    expect(authorizationHeaders).toEqual(['Bearer old-token', 'Bearer new-token'])
  })

  it('adds the configured minor version without removing query parameters', () => {
    const client = new QuickBooksClient({
      environment: 'production',
      getAccessToken: async () => 'token',
      minorVersion: '80',
      realmId: 'realm-1',
    })

    expect(client.withMinorVersion('/query?query=SELECT+*+FROM+Account')).toBe(
      '/query?query=SELECT+*+FROM+Account&minorversion=80',
    )
    expect(client.companyPath('/query')).toBe('/v3/company/realm-1/query')
  })

  it('rejects a company response without company information', async () => {
    const client = new QuickBooksClient({
      environment: 'production',
      fetch: async () => Response.json({ QueryResponse: {} }),
      getAccessToken: async () => 'token',
      realmId: 'realm-1',
    })

    await expect(client.getCompanyInfo()).rejects.toBeInstanceOf(ProviderApiError)
  })

  it('does not refresh more than once for repeated unauthorized responses', async () => {
    const refreshRequests: boolean[] = []
    const client = new QuickBooksClient({
      environment: 'production',
      fetch: async () => Response.json({ fault: 'expired' }, { status: 401 }),
      getAccessToken: async (forceRefresh) => {
        refreshRequests.push(forceRefresh ?? false)
        return 'token'
      },
      realmId: 'realm-1',
      retry: { maxAttempts: 1 },
    })

    await expect(client.request('/query')).rejects.toBeInstanceOf(AuthenticationError)
    expect(refreshRequests).toEqual([false, true])
  })
})
