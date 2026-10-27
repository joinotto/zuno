// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest'
import { PlaidApiError, PlaidClient } from '../src/index.js'

describe('PlaidClient', () => {
  it('routes provider operations to their native Plaid endpoints', async () => {
    const paths: string[] = []
    const client = new PlaidClient({
      clientId: 'client-id',
      environment: 'development',
      fetch: async (input) => {
        paths.push(new URL(input instanceof Request ? input.url : input).pathname)
        return Response.json({ request_id: 'request-1' })
      },
      secret: 'secret',
    })

    await client.getLinkToken({ link_token: 'link-token' })
    await client.exchangePublicToken({ public_token: 'public-token' })
    await client.getItem({ access_token: 'access-token' })
    await client.removeItem({ access_token: 'access-token' })
    await client.updateItemWebhook({
      access_token: 'access-token',
      webhook: 'https://example.com/webhooks/plaid',
    })
    await client.invalidateAccessToken({ access_token: 'access-token' })
    await client.getAccounts({ access_token: 'access-token' })
    await client.getBalances({ access_token: 'access-token' })
    await client.refreshTransactions({ access_token: 'access-token' })
    await client.getIdentity({ access_token: 'access-token' })
    await client.getLiabilities({ access_token: 'access-token' })
    await client.getInstitutionById({
      country_codes: ['US'],
      institution_id: 'ins_1',
    })
    await client.searchInstitutions({
      country_codes: ['US'],
      query: 'Zuno Bank',
    })
    await client.getWebhookVerificationKey({ key_id: 'key-1' })

    expect(paths).toEqual([
      '/link/token/get',
      '/item/public_token/exchange',
      '/item/get',
      '/item/remove',
      '/item/webhook/update',
      '/item/access_token/invalidate',
      '/accounts/get',
      '/accounts/balance/get',
      '/transactions/refresh',
      '/identity/get',
      '/liabilities/get',
      '/institutions/get_by_id',
      '/institutions/search',
      '/webhook_verification_key/get',
    ])
  })

  it('uses Plaid headers and the selected environment', async () => {
    const requests: Request[] = []
    const client = new PlaidClient({
      clientId: 'client-id',
      environment: 'sandbox',
      fetch: async (input, init) => {
        requests.push(new Request(input, init))
        return Response.json({
          expiration: '2026-10-27T10:00:00Z',
          link_token: 'link-sandbox-test',
          request_id: 'request-1',
        })
      },
      secret: 'secret',
    })

    await expect(
      client.createLinkToken({
        client_name: 'Zuno',
        country_codes: ['US'],
        language: 'en',
        products: ['transactions'],
        user: { client_user_id: 'user-1' },
      }),
    ).resolves.toMatchObject({ link_token: 'link-sandbox-test' })

    const request = requests[0]
    expect(request?.url).toBe('https://sandbox.plaid.com/link/token/create')
    expect(request?.method).toBe('POST')
    expect(request?.headers.get('plaid-client-id')).toBe('client-id')
    expect(request?.headers.get('plaid-secret')).toBe('secret')
    expect(request?.headers.get('plaid-version')).toBe('2020-09-14')
  })

  it('maps Plaid error fields into PlaidApiError', async () => {
    const client = new PlaidClient({
      clientId: 'client-id',
      environment: 'sandbox',
      fetch: async () =>
        Response.json(
          {
            error_code: 'ITEM_LOGIN_REQUIRED',
            error_message: 'the login details must be updated',
            error_type: 'ITEM_ERROR',
            request_id: 'request-2',
          },
          { status: 400 },
        ),
      retry: { maxAttempts: 1 },
      secret: 'secret',
    })

    const error = await client
      .getItem({ access_token: 'access-token' })
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(PlaidApiError)
    expect(error).toMatchObject({
      errorCode: 'ITEM_LOGIN_REQUIRED',
      errorType: 'ITEM_ERROR',
      requestId: 'request-2',
      requiresUpdateMode: true,
      status: 400,
    })
  })

  it('collects every Transactions Sync page', async () => {
    const cursors: (string | undefined)[] = []
    const client = new PlaidClient({
      clientId: 'client-id',
      environment: 'sandbox',
      fetch: async (_input, init) => {
        if (typeof init?.body !== 'string') {
          throw new TypeError('Expected a JSON request body.')
        }
        const body = JSON.parse(init.body) as { cursor?: string }
        cursors.push(body.cursor)
        return body.cursor === undefined
          ? Response.json({
              accounts: [{ account_id: 'account-1' }],
              added: [{ transaction_id: 'transaction-1' }],
              has_more: true,
              modified: [],
              next_cursor: 'cursor-1',
              removed: [],
              request_id: 'request-1',
            })
          : Response.json({
              accounts: [{ account_id: 'account-1' }],
              added: [{ transaction_id: 'transaction-2' }],
              has_more: false,
              modified: [],
              next_cursor: 'cursor-2',
              removed: [{ account_id: 'account-1', transaction_id: 'removed-1' }],
              request_id: 'request-2',
            })
      },
      secret: 'secret',
    })

    await expect(
      client.syncAllTransactions({ access_token: 'access-token' }),
    ).resolves.toMatchObject({
      added: [{ transaction_id: 'transaction-1' }, { transaction_id: 'transaction-2' }],
      next_cursor: 'cursor-2',
      removed: [{ transaction_id: 'removed-1' }],
      request_ids: ['request-1', 'request-2'],
    })
    expect(cursors).toEqual([undefined, 'cursor-1'])
  })

  it('restarts Transactions Sync after a pagination mutation', async () => {
    let requests = 0
    const client = new PlaidClient({
      clientId: 'client-id',
      environment: 'sandbox',
      fetch: async () => {
        requests += 1
        if (requests === 1) {
          return Response.json({
            accounts: [],
            added: [{ transaction_id: 'discarded-transaction' }],
            has_more: true,
            modified: [],
            next_cursor: 'mutated-cursor',
            removed: [],
            request_id: 'request-1',
          })
        }
        if (requests === 2) {
          return Response.json(
            {
              error_code: 'TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION',
              error_message: 'restart pagination',
              error_type: 'TRANSACTIONS_ERROR',
              request_id: 'request-2',
            },
            { status: 400 },
          )
        }
        return Response.json({
          accounts: [],
          added: [{ transaction_id: 'retained-transaction' }],
          has_more: false,
          modified: [],
          next_cursor: 'final-cursor',
          removed: [],
          request_id: 'request-3',
        })
      },
      retry: { maxAttempts: 1 },
      secret: 'secret',
    })

    const result = await client.syncAllTransactions({ access_token: 'access-token' })

    expect(result.added).toEqual([{ transaction_id: 'retained-transaction' }])
    expect(result.next_cursor).toBe('final-cursor')
    expect(requests).toBe(3)
  })
})
