// SPDX-License-Identifier: Apache-2.0

export type TransactionLegType = 'credit' | 'debit'

export function encodeTransactionLegId(
  type: TransactionLegType,
  id: string,
  amount: number,
): string {
  return Buffer.from(JSON.stringify({ type, id, amount })).toString('base64')
}
