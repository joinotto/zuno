// SPDX-License-Identifier: Apache-2.0

import type { MaybePromise, ProviderManifest } from '@ottoai/zuno'

export interface ConformanceCase<Subject> {
  name: string
  run: (subject: Subject) => MaybePromise<void>
}

export interface ConformanceCaseResult {
  error?: Error
  name: string
  passed: boolean
}

export interface ConformanceResult {
  passed: boolean
  results: readonly ConformanceCaseResult[]
}

export class ConformanceError extends Error {
  readonly result: ConformanceResult

  constructor(result: ConformanceResult) {
    const failures = result.results
      .filter((caseResult) => !caseResult.passed)
      .map((caseResult) => caseResult.name)
      .join(', ')

    super(`Provider conformance failed: ${failures}.`)
    this.name = 'ConformanceError'
    this.result = result
  }
}

export async function runConformanceSuite<Subject>(
  subject: Subject,
  cases: readonly ConformanceCase<Subject>[],
): Promise<ConformanceResult> {
  const results: ConformanceCaseResult[] = []

  for (const conformanceCase of cases) {
    try {
      await conformanceCase.run(subject)
      results.push({ name: conformanceCase.name, passed: true })
    } catch (error) {
      results.push({
        error: error instanceof Error ? error : new Error(String(error)),
        name: conformanceCase.name,
        passed: false,
      })
    }
  }

  return {
    passed: results.every((result) => result.passed),
    results,
  }
}

export function assertConformance(result: ConformanceResult): void {
  if (!result.passed) {
    throw new ConformanceError(result)
  }
}

export const providerManifestConformance: readonly ConformanceCase<ProviderManifest>[] = [
  {
    name: 'provider id',
    run: (manifest) => {
      assert(
        /^[a-z][a-z0-9-]*$/u.test(manifest.id),
        'The provider id must use lowercase kebab-case.',
      )
    },
  },
  {
    name: 'provider identity',
    run: (manifest) => {
      assert(manifest.displayName.trim() !== '', 'The provider display name must not be empty.')
      assert(manifest.category.trim() !== '', 'The provider category must not be empty.')
    },
  },
  {
    name: 'provider environments',
    run: (manifest) => {
      assertUniqueNonEmptyValues(manifest.environments, 'environment')
    },
  },
  {
    name: 'provider capabilities',
    run: (manifest) => {
      const capabilityGroups = Object.entries(manifest.capabilities)
      assert(capabilityGroups.length > 0, 'The provider must declare capabilities.')

      for (const [group, operations] of capabilityGroups) {
        assert(group.trim() !== '', 'A capability group must not be empty.')
        assertUniqueNonEmptyValues(operations, `operation in ${group}`)
      }
    },
  },
  {
    name: 'provider authentication',
    run: (manifest) => {
      if (manifest.auth.type !== 'oauth2') {
        assert(
          manifest.auth.pkce === undefined && manifest.auth.rotatesRefreshTokens === undefined,
          'Only OAuth providers can declare PKCE or refresh-token rotation.',
        )
      }
    },
  },
]

export async function checkProviderManifest(
  manifest: ProviderManifest,
): Promise<ConformanceResult> {
  return runConformanceSuite(manifest, providerManifestConformance)
}

export async function assertProviderManifestConforms(
  manifest: ProviderManifest,
): Promise<void> {
  assertConformance(await checkProviderManifest(manifest))
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function assertUniqueNonEmptyValues(values: readonly string[], name: string): void {
  assert(values.length > 0, `The provider must declare at least one ${name}.`)
  assert(values.every((value) => value.trim() !== ''), `A provider ${name} must not be empty.`)
  assert(new Set(values).size === values.length, `Provider ${name} values must be unique.`)
}
