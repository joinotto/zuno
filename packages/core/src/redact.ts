// SPDX-License-Identifier: Apache-2.0

const sensitiveKey = /authorization|client.?secret|access.?token|refresh.?token|password|api.?key/iu

export function redact<T>(value: T): T {
  return redactValue(value, new WeakSet()) as T
}

function redactValue(value: unknown, seen: WeakSet<object>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, seen))
  }

  if (value === null || typeof value !== 'object') {
    return value
  }

  if (seen.has(value)) {
    return '[Circular]'
  }

  seen.add(value)

  const redacted = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      sensitiveKey.test(key) ? '[REDACTED]' : redactValue(item, seen),
    ]),
  )

  seen.delete(value)
  return redacted
}
