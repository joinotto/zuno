// SPDX-License-Identifier: Apache-2.0

import { defineProviderManifest } from '@ottoai/zuno'
import { describe, expect, it } from 'vitest'
import {
  assertConformance,
  checkProviderManifest,
  ConformanceError,
  runConformanceSuite,
} from '../src/index.js'

const validManifest = defineProviderManifest({
  auth: {
    pkce: true,
    rotatesRefreshTokens: true,
    type: 'oauth2',
  },
  capabilities: {
    records: ['list', 'get'],
  },
  category: 'test',
  displayName: 'Test Provider',
  environments: ['sandbox', 'production'],
  id: 'test-provider',
  support: 'experimental',
})

describe('provider manifest conformance', () => {
  it('accepts a valid provider manifest', async () => {
    await expect(checkProviderManifest(validManifest)).resolves.toMatchObject({
      passed: true,
    })
  })

  it('reports every failing manifest case', async () => {
    const result = await checkProviderManifest({
      ...validManifest,
      auth: {
        pkce: true,
        type: 'api-key',
      },
      capabilities: {
        records: ['list', 'list'],
      },
      environments: [],
      id: 'Invalid Provider',
    })

    expect(result.passed).toBe(false)
    expect(
      result.results.filter((caseResult) => !caseResult.passed).map(({ name }) => name),
    ).toEqual([
      'provider id',
      'provider environments',
      'provider capabilities',
      'provider authentication',
    ])
    expect(() => assertConformance(result)).toThrow(ConformanceError)
  })
})

describe('conformance runner', () => {
  it('supports reusable synchronous and asynchronous cases', async () => {
    const result = await runConformanceSuite('subject', [
      {
        name: 'synchronous',
        run: (subject) => {
          expect(subject).toBe('subject')
        },
      },
      {
        name: 'asynchronous',
        run: async (subject) => {
          await Promise.resolve()
          expect(subject).toBe('subject')
        },
      },
    ])

    expect(result).toEqual({
      passed: true,
      results: [
        { name: 'synchronous', passed: true },
        { name: 'asynchronous', passed: true },
      ],
    })
  })
})
