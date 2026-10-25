// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'vitest/config'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  cacheDir: process.env.VITEST_CACHE_DIR ?? 'node_modules/.vitest',
  resolve: {
    alias: {
      '@ottoai/zuno': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
      '@ottoai/zuno-oauth': fileURLToPath(
        new URL('./packages/oauth/src/index.ts', import.meta.url),
      ),
      '@ottoai/zuno-testing': fileURLToPath(
        new URL('./packages/testing/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    coverage: {
      exclude: ['**/src/index.ts', '**/src/manifest.ts'],
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      reportsDirectory: process.env.COVERAGE_DIR ?? 'coverage',
      thresholds: {
        branches: 85,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    include: ['packages/*/test/**/*.test.ts', 'providers/*/test/**/*.test.ts'],
  },
})
