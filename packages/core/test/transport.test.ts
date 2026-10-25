// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest'
import {
  AuthorizationError,
  ConnectionError,
  createTransport,
  ProviderApiError,
  RateLimitError,
  TimeoutError,
} from '../src/index.js'
import type { AuthenticationError } from '../src/index.js'

describe('transport', () => {
  it('returns data and response metadata', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'account-1' }), {
        headers: {
          'content-type': 'application/json',
          intuit_tid: 'request-1',
          'x-ratelimit-remaining': '9',
        },
      }),
    )
    const transport = createTransport({
      baseUrl: 'https://example.test/v1/',
      fetch: fetchImplementation,
      provider: 'test',
    })

    const result = await transport.request<{ id: string }>({
      operation: 'accounts.get',
      path: '/accounts/1',
      response: 'full',
    })

    expect(result.data).toEqual({ id: 'account-1' })
    expect(result.metadata).toMatchObject({
      attempts: 1,
      operation: 'accounts.get',
      provider: 'test',
      rateLimit: { remaining: 9 },
      requestId: 'request-1',
      status: 200,
    })
    expect(fetchImplementation).toHaveBeenCalledWith(
      new URL('https://example.test/v1/accounts/1'),
      expect.any(Object),
    )
  })

  it('maps authentication errors and redacts tokens', async () => {
    const transport = createTransport({
      baseUrl: 'https://example.test',
      fetch: async () =>
        new Response(JSON.stringify({ accessToken: 'secret' }), {
          headers: { 'content-type': 'application/json' },
          status: 401,
        }),
      provider: 'test',
    })

    const request = transport.request({
      operation: 'accounts.list',
      path: '/accounts',
    })

    await expect(request).rejects.toMatchObject({
      body: { accessToken: '[REDACTED]' },
      name: 'AuthenticationError',
      retryable: false,
      status: 401,
    } satisfies Partial<AuthenticationError>)
  })

  it('retries safe requests', async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('busy', { status: 503 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          headers: { 'content-type': 'application/json' },
        }),
      )
    const onRetry = vi.fn()
    const transport = createTransport({
      baseUrl: 'https://example.test',
      fetch: fetchImplementation,
      hooks: { onRetry },
      provider: 'test',
      retry: { baseDelayMs: 0, maxDelayMs: 0 },
    })

    await expect(
      transport.request({
        operation: 'health.get',
        path: '/health',
      }),
    ).resolves.toEqual({ ok: true })
    expect(fetchImplementation).toHaveBeenCalledTimes(2)
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('does not retry an unsafe request without an idempotency key', async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('busy', { status: 503 }))
    const transport = createTransport({
      baseUrl: 'https://example.test',
      fetch: fetchImplementation,
      provider: 'test',
      retry: { baseDelayMs: 0, maxDelayMs: 0 },
    })

    await expect(
      transport.request({
        init: { method: 'POST' },
        operation: 'invoice.create',
        path: '/invoices',
      }),
    ).rejects.toMatchObject({ status: 503 })
    expect(fetchImplementation).toHaveBeenCalledOnce()
  })

  it('maps rate-limit errors after all attempts', async () => {
    const transport = createTransport({
      baseUrl: 'https://example.test',
      fetch: async () => new Response('', { status: 429 }),
      provider: 'test',
      retry: { baseDelayMs: 0, maxAttempts: 1, maxDelayMs: 0 },
    })

    await expect(
      transport.request({
        operation: 'accounts.list',
        path: '/accounts',
      }),
    ).rejects.toBeInstanceOf(RateLimitError)
  })

  it('maps network failures', async () => {
    const transport = createTransport({
      baseUrl: 'https://example.test',
      fetch: async () => {
        throw new Error('offline')
      },
      provider: 'test',
      retry: { baseDelayMs: 0, maxAttempts: 1, maxDelayMs: 0 },
    })

    await expect(
      transport.request({
        operation: 'accounts.list',
        path: '/accounts',
      }),
    ).rejects.toBeInstanceOf(ConnectionError)
  })

  it('supports text and empty responses', async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('ready'))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    const transport = createTransport({
      baseUrl: 'https://example.test',
      fetch: fetchImplementation,
      provider: 'test',
    })

    await expect(
      transport.request({
        operation: 'health.get',
        path: 'https://status.example.test/health',
      }),
    ).resolves.toBe('ready')
    await expect(
      transport.request({
        operation: 'health.delete',
        path: '/health',
      }),
    ).resolves.toBeUndefined()
  })

  it('supports custom response parsing', async () => {
    const transport = createTransport({
      baseUrl: 'https://example.test',
      fetch: async () => new Response('42'),
      provider: 'test',
    })

    await expect(
      transport.request({
        operation: 'value.get',
        parse: async (response) => Number(await response.text()),
        path: '/value',
      }),
    ).resolves.toBe(42)
  })

  it('retries an unsafe request with an idempotency key', async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('busy', { status: 503 }))
      .mockResolvedValueOnce(new Response('created', { status: 201 }))
    const transport = createTransport({
      baseUrl: 'https://example.test',
      fetch: fetchImplementation,
      provider: 'test',
      retry: { baseDelayMs: 0, maxDelayMs: 0 },
    })

    await expect(
      transport.request({
        idempotencyKey: 'request-1',
        init: { method: 'POST' },
        operation: 'invoice.create',
        path: '/invoices',
      }),
    ).resolves.toBe('created')

    const secondCall = fetchImplementation.mock.calls[1]
    const headers = new Headers(secondCall?.[1]?.headers)
    expect(headers.get('idempotency-key')).toBe('request-1')
  })

  it.each([
    [403, AuthorizationError],
    [400, ProviderApiError],
  ])('maps status %s errors', async (status, ErrorType) => {
    const transport = createTransport({
      baseUrl: 'https://example.test',
      fetch: async () => new Response('', { status }),
      provider: 'test',
    })

    await expect(
      transport.request({
        init: { method: 'POST' },
        operation: 'accounts.update',
        path: '/accounts',
      }),
    ).rejects.toBeInstanceOf(ErrorType)
  })

  it('maps request timeouts', async () => {
    const transport = createTransport({
      baseUrl: 'https://example.test',
      fetch: async (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        }),
      provider: 'test',
      retry: { maxAttempts: 1 },
      timeoutMs: 1,
    })

    await expect(
      transport.request({
        operation: 'accounts.list',
        path: '/accounts',
      }),
    ).rejects.toBeInstanceOf(TimeoutError)
  })
})
