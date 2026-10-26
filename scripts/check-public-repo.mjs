// SPDX-License-Identifier: Apache-2.0

import console from 'node:console'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'
import process from 'node:process'

const failures = []
const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
const contentScanExclusions = new Set(['scripts/check-public-repo.mjs'])

const forbiddenPaths = [
  /(^|\/)\.env(?:\.|$)/u,
  /(^|\/)(?:coverage|dist|node_modules)\//u,
  /\.(?:key|p12|pem|pfx|tgz|zip)$/u,
]

const forbiddenContent = [
  {
    label: 'AWS access key',
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/gu,
  },
  {
    label: 'GitHub token',
    pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/gu,
  },
  {
    label: 'JWT value',
    pattern: /\beyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/gu,
  },
  {
    label: 'npm token',
    pattern: /\bnpm_[A-Za-z0-9]{20,}\b/gu,
  },
  {
    label: 'private key',
    pattern: /-----BEGIN (?:EC |OPENSSH |RSA )?PRIVATE KEY-----/gu,
  },
  {
    label: 'private workstation path',
    pattern: /\/Users\/[^/\s]+\/|\/home\/[^/\s]+\//gu,
  },
  {
    label: 'obsolete repository reference',
    pattern: /github\.com\/(?:clerqhq|midday-ai)\/zuno/giu,
  },
  {
    label: 'private service reference',
    pattern: /(?:api|ledger)\.joinotto\.com/giu,
  },
  {
    label: 'removed compatibility package',
    pattern: /@ottoai\/zuno-compat-unified/gu,
  },
  {
    label: 'removed SDK dependency',
    pattern: /@unified-api\//gu,
  },
  {
    label: 'removed prototype branch',
    pattern: /local\/prototype-history-/gu,
  },
]

for (const file of trackedFiles) {
  for (const pattern of forbiddenPaths) {
    if (pattern.test(file)) {
      failures.push(`${file}: forbidden tracked path`)
    }
  }

  const content = await readFile(file)

  if (content.includes(0)) {
    continue
  }

  const text = content.toString('utf8')

  if (!contentScanExclusions.has(file)) {
    for (const rule of forbiddenContent) {
      rule.pattern.lastIndex = 0

      if (rule.pattern.test(text)) {
        failures.push(`${file}: contains ${rule.label}`)
      }
    }
  }

  if (isProjectSource(file) && !text.startsWith('// SPDX-License-Identifier: Apache-2.0')) {
    failures.push(`${file}: missing Apache-2.0 SPDX identifier`)
  }

  if (file.startsWith('.github/workflows/')) {
    checkWorkflowPins(file, text)
  }
}

if (failures.length > 0) {
  console.error('Public repository checks failed.')
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Public repository checks passed for ${trackedFiles.length} tracked files.`)
}

function isProjectSource(file) {
  const extension = extname(file)

  if (extension !== '.ts' && extension !== '.mjs') {
    return false
  }

  return (
    file.startsWith('packages/') ||
    file.startsWith('providers/') ||
    file.startsWith('scripts/') ||
    file === 'eslint.config.mjs' ||
    file === 'vitest.config.mjs'
  )
}

function checkWorkflowPins(file, text) {
  for (const [index, line] of text.split('\n').entries()) {
    const match = line.match(/^\s*uses:\s*(\S+)/u)

    if (match === null || match[1]?.startsWith('./') === true) {
      continue
    }

    if (!/@[a-f0-9]{40}(?:\s|$)/u.test(line)) {
      failures.push(`${file}:${index + 1}: GitHub Action must use a full commit digest`)
    }
  }
}
