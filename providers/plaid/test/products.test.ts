// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest'
import { PlaidApiError, PlaidClient, verifyPlaidContentHash } from '../src/index.js'

describe('Plaid bookkeeping products', () => {
  it('routes each product operation to the native Plaid endpoint', async () => {
    const paths: string[] = []
    const client = new PlaidClient({
      clientId: 'client-id',
      environment: 'sandbox',
      fetch: async (input) => {
        const path = new URL(input instanceof Request ? input.url : input).pathname
        paths.push(path)

        if (path === '/statements/download' || path === '/asset_report/pdf/get') {
          return new Response('pdf-data', {
            headers: {
              'content-type': 'application/pdf',
              'plaid-content-hash':
                '31d5f47f6f8f7f991d37f7c92ce0f89e0d733e39f6f3f41d6f2c3d92df30ac69',
              'plaid-request-id': 'request-binary',
            },
          })
        }

        return Response.json({ request_id: 'request-1' })
      },
      secret: 'secret',
    })

    await client.getAuth({ access_token: 'access-token' })
    await client.getTransactions({
      access_token: 'access-token',
      end_date: '2026-10-27',
      start_date: '2026-01-01',
    })
    await client.getRecurringTransactions({ access_token: 'access-token' })
    await client.getInvestmentHoldings({ access_token: 'access-token' })
    await client.getInvestmentTransactions({
      access_token: 'access-token',
      end_date: '2026-10-27',
      start_date: '2026-01-01',
    })
    await client.refreshInvestments({ access_token: 'access-token' })
    await client.enrichTransactions({
      account_type: 'depository',
      transactions: [
        {
          amount: 10,
          description: 'Coffee',
          direction: 'OUTFLOW',
          id: 'transaction-1',
          iso_currency_code: 'USD',
        },
      ],
    })
    await client.createProcessorToken({
      access_token: 'access-token',
      account_id: 'account-1',
      processor: 'dwolla',
    })
    await client.createStripeBankAccountToken({
      access_token: 'access-token',
      account_id: 'account-1',
    })
    await client.setProcessorTokenPermissions({
      processor_token: 'processor-token',
      products: ['transactions'],
    })
    await client.listStatements({ access_token: 'access-token' })
    await client.downloadStatement({
      access_token: 'access-token',
      statement_id: 'statement-1',
    })
    await client.refreshStatements({
      access_token: 'access-token',
      end_date: '2026-10-27',
      start_date: '2026-01-01',
    })
    await client.createAssetReport({
      access_tokens: ['access-token'],
      days_requested: 365,
    })
    await client.getAssetReport({ asset_report_token: 'asset-report-token' })
    await client.downloadAssetReportPdf({ asset_report_token: 'asset-report-token' })
    await client.refreshAssetReport({
      asset_report_token: 'asset-report-token',
      days_requested: 365,
    })
    await client.filterAssetReport({
      account_ids_to_exclude: ['account-1'],
      asset_report_token: 'asset-report-token',
    })
    await client.removeAssetReport({ asset_report_token: 'asset-report-token' })
    await client.createAssetReportAuditCopy({
      asset_report_token: 'asset-report-token',
      auditor_id: 'auditor-1',
    })
    await client.removeAssetReportAuditCopy({ audit_copy_token: 'audit-copy-token' })

    expect(paths).toEqual([
      '/auth/get',
      '/transactions/get',
      '/transactions/recurring/get',
      '/investments/holdings/get',
      '/investments/transactions/get',
      '/investments/refresh',
      '/transactions/enrich',
      '/processor/token/create',
      '/processor/stripe/bank_account_token/create',
      '/processor/token/permissions/set',
      '/statements/list',
      '/statements/download',
      '/statements/refresh',
      '/asset_report/create',
      '/asset_report/get',
      '/asset_report/pdf/get',
      '/asset_report/refresh',
      '/asset_report/filter',
      '/asset_report/remove',
      '/asset_report/audit_copy/create',
      '/asset_report/audit_copy/remove',
    ])
  })

  it('collects every Transactions Get page', async () => {
    const offsets: number[] = []
    const client = new PlaidClient({
      clientId: 'client-id',
      environment: 'sandbox',
      fetch: async (_input, init) => {
        const body = parseBody(init) as { options: { offset: number } }
        offsets.push(body.options.offset)
        const secondPage = body.options.offset === 1
        return Response.json({
          accounts: [{ account_id: 'account-1' }],
          item: { item_id: 'item-1' },
          request_id: secondPage ? 'request-2' : 'request-1',
          total_transactions: 2,
          transactions: [
            {
              transaction_id: secondPage ? 'transaction-2' : 'transaction-1',
            },
          ],
        })
      },
      secret: 'secret',
    })

    await expect(
      client.getAllTransactions({
        access_token: 'access-token',
        end_date: '2026-10-27',
        options: { count: 1 },
        start_date: '2026-01-01',
      }),
    ).resolves.toMatchObject({
      request_ids: ['request-1', 'request-2'],
      total_transactions: 2,
      transactions: [{ transaction_id: 'transaction-1' }, { transaction_id: 'transaction-2' }],
    })
    expect(offsets).toEqual([0, 1])
  })

  it('collects every investment transaction page', async () => {
    const offsets: number[] = []
    const client = new PlaidClient({
      clientId: 'client-id',
      environment: 'sandbox',
      fetch: async (_input, init) => {
        const body = parseBody(init) as { options: { offset: number } }
        offsets.push(body.options.offset)
        const secondPage = body.options.offset === 1
        return Response.json({
          accounts: [],
          investment_transactions: [
            {
              investment_transaction_id: secondPage ? 'investment-2' : 'investment-1',
            },
          ],
          item: {
            available_products: [],
            billed_products: [],
            error: null,
            institution_id: null,
            item_id: 'item-1',
            products: [],
            update_type: 'background',
            webhook: '',
          },
          request_id: secondPage ? 'request-2' : 'request-1',
          securities: [],
          total_investment_transactions: 2,
        })
      },
      secret: 'secret',
    })

    await expect(
      client.getAllInvestmentTransactions({
        access_token: 'access-token',
        end_date: '2026-10-27',
        options: { count: 1 },
        start_date: '2026-01-01',
      }),
    ).resolves.toMatchObject({
      investment_transactions: [
        { investment_transaction_id: 'investment-1' },
        { investment_transaction_id: 'investment-2' },
      ],
      request_ids: ['request-1', 'request-2'],
      total_investment_transactions: 2,
    })
    expect(offsets).toEqual([0, 1])
  })

  it('returns downloads with response metadata and verifies content hashes', async () => {
    const client = new PlaidClient({
      clientId: 'client-id',
      environment: 'sandbox',
      fetch: async () =>
        new Response('hello', {
          headers: {
            'content-type': 'application/pdf',
            'plaid-content-hash':
              '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
            'plaid-request-id': 'request-1',
          },
        }),
      secret: 'secret',
    })

    const response = await client.downloadStatement({
      access_token: 'access-token',
      statement_id: 'statement-1',
    })

    expect(new TextDecoder().decode(response.data)).toBe('hello')
    expect(response).toMatchObject({
      contentHash: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      contentType: 'application/pdf',
      requestId: 'request-1',
    })
    await expect(verifyPlaidContentHash(response.data, response.contentHash ?? '')).resolves.toBe(
      true,
    )
    await expect(verifyPlaidContentHash(response.data, 'incorrect')).resolves.toBe(false)
  })

  it('stops offset pagination when Plaid returns an empty page', async () => {
    const client = new PlaidClient({
      clientId: 'client-id',
      environment: 'sandbox',
      fetch: async () =>
        Response.json({
          accounts: [],
          item: {},
          request_id: 'request-1',
          total_transactions: 5,
          transactions: [],
        }),
      secret: 'secret',
    })

    await expect(
      client.getAllTransactions({
        access_token: 'access-token',
        end_date: '2026-10-27',
        start_date: '2026-01-01',
      }),
    ).resolves.toMatchObject({
      request_ids: ['request-1'],
      transactions: [],
    })
  })

  it('stops investment pagination when Plaid returns an empty page', async () => {
    const client = new PlaidClient({
      clientId: 'client-id',
      environment: 'sandbox',
      fetch: async () =>
        Response.json({
          accounts: [],
          investment_transactions: [],
          item: {
            available_products: [],
            billed_products: [],
            error: null,
            institution_id: null,
            item_id: 'item-1',
            products: [],
            update_type: 'background',
            webhook: '',
          },
          request_id: 'request-1',
          securities: [],
          total_investment_transactions: 5,
        }),
      secret: 'secret',
    })

    await expect(
      client.getAllInvestmentTransactions({
        access_token: 'access-token',
        end_date: '2026-10-27',
        start_date: '2026-01-01',
      }),
    ).resolves.toMatchObject({
      investment_transactions: [],
      request_ids: ['request-1'],
    })
  })

  it('supports binary responses without optional Plaid headers', async () => {
    const client = new PlaidClient({
      clientId: 'client-id',
      environment: 'sandbox',
      fetch: async () => new Response(new Uint8Array([1, 2, 3])),
      secret: 'secret',
    })

    await expect(
      client.downloadAssetReportPdf({ asset_report_token: 'asset-report-token' }),
    ).resolves.toEqual({
      data: new Uint8Array([1, 2, 3]),
    })

    const data = new Uint8Array([104, 101, 108, 108, 111]).buffer
    await expect(
      verifyPlaidContentHash(
        data,
        '2CF24DBA5FB0A30E26E83B2AC5B9E29E1B161E5C1FA7425E73043362938B9824',
      ),
    ).resolves.toBe(true)
  })

  it('maps Plaid download errors into PlaidApiError', async () => {
    const client = new PlaidClient({
      clientId: 'client-id',
      environment: 'sandbox',
      fetch: async () =>
        Response.json(
          {
            error_code: 'ASSET_REPORT_NOT_READY',
            error_message: 'the report is not ready',
            error_type: 'ASSET_REPORT_ERROR',
            request_id: 'request-error',
          },
          { status: 400 },
        ),
      retry: { maxAttempts: 1 },
      secret: 'secret',
    })

    await expect(
      client.downloadAssetReportPdf({ asset_report_token: 'asset-report-token' }),
    ).rejects.toBeInstanceOf(PlaidApiError)
  })
})

function parseBody(init: RequestInit | undefined): unknown {
  if (typeof init?.body !== 'string') {
    throw new TypeError('Expected a JSON request body.')
  }
  return JSON.parse(init.body) as unknown
}
