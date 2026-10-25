// SPDX-License-Identifier: Apache-2.0

import type { RetryPolicy } from './types.js'

export const defaultRetryPolicy: RetryPolicy = {
  baseDelayMs: 250,
  maxAttempts: 3,
  maxDelayMs: 5_000,
  retryStatusCodes: new Set([408, 429, 500, 502, 503, 504]),
}

export function createRetryPolicy(policy: Partial<RetryPolicy> = {}): RetryPolicy {
  return {
    ...defaultRetryPolicy,
    ...policy,
    retryStatusCodes: policy.retryStatusCodes ?? defaultRetryPolicy.retryStatusCodes,
  }
}

export function getRetryDelay(
  attempt: number,
  policy: RetryPolicy,
  retryAfter: string | null,
): number {
  const providerDelay = parseRetryAfter(retryAfter)

  if (providerDelay !== undefined) {
    return Math.min(providerDelay, policy.maxDelayMs)
  }

  const exponentialDelay = policy.baseDelayMs * 2 ** Math.max(0, attempt - 1)
  return Math.min(exponentialDelay, policy.maxDelayMs)
}

export function parseRetryAfter(value: string | null, now = Date.now()): number | undefined {
  if (value === null) {
    return undefined
  }

  const seconds = Number(value)

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1_000
  }

  const date = Date.parse(value)

  if (Number.isNaN(date)) {
    return undefined
  }

  return Math.max(0, date - now)
}
