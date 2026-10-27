// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest'
import { PlaidApiError } from '../src/index.js'

describe('PlaidApiError', () => {
  it.each([
    { error_code: 'USER_PERMISSION_REVOKED' },
    { error_code_reason: 'OAUTH_CONSENT_EXPIRED' },
    { error_code_reason: 'OAUTH_INVALID_TOKEN' },
    { error_code_reason: 'OAUTH_USER_REVOKED' },
  ])('identifies Item update-mode errors', (body) => {
    const error = new PlaidApiError(body, 400, 'item.get')

    expect(error.requiresUpdateMode).toBe(true)
  })

  it('does not classify an unrelated Item error as update mode', () => {
    const error = new PlaidApiError({ error_code: 'INSTITUTION_DOWN' }, 400, 'item.get')

    expect(error.requiresUpdateMode).toBe(false)
  })
})
