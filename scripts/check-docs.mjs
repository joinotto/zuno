// SPDX-License-Identifier: Apache-2.0

import console from 'node:console'
import { readFile, readdir } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const excludedDirectories = new Set(['.git', '.types', 'coverage', 'dist', 'node_modules'])
const informalTerms = [
  /\band\/or\b/iu,
  /\bas well as\b/iu,
  /\bbasically\b/iu,
  /\beasily\b/iu,
  /\beasy\b/iu,
  /\betc\.\b/iu,
  /\bin order to\b/iu,
  /\bjust\b/iu,
  /\bmake sure\b/iu,
  /\bobviously\b/iu,
  /\bplease\b/iu,
  /\bsimply\b/iu,
]

async function findMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) {
      continue
    }

    const entryPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await findMarkdownFiles(entryPath)))
      continue
    }

    if (extname(entry.name) === '.md') {
      files.push(entryPath)
    }
  }

  return files
}

function removeMarkdownSyntax(line) {
  return line
    .replaceAll(/`[^`]+`/gu, 'TERM')
    .replaceAll(/\[[^\]]+\]\([^)]+\)/gu, 'LINK')
    .replaceAll(/[*_~]/gu, '')
    .trim()
}

function countWords(line) {
  const text = removeMarkdownSyntax(line)
  return text === '' ? 0 : text.split(/\s+/u).length
}

function isProseLine(line, inCodeBlock) {
  if (inCodeBlock || line.trim() === '') {
    return false
  }

  return !/^\s*(?:#|[-*+] |\d+\. |\||>|<)/u.test(line)
}

const failures = []
const markdownFiles = await findMarkdownFiles(root)

for (const file of markdownFiles) {
  const content = await readFile(file, 'utf8')
  const lines = content.split('\n')
  let inCodeBlock = false

  for (const [index, line] of lines.entries()) {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }

    if (!isProseLine(line, inCodeBlock)) {
      continue
    }

    const wordCount = countWords(line)
    const fileName = relative(root, file)

    if (wordCount > 25) {
      failures.push(`${fileName}:${index + 1} has ${wordCount} words`)
    }

    for (const term of informalTerms) {
      if (term.test(line)) {
        failures.push(`${fileName}:${index + 1} contains ${term.source}`)
      }
    }
  }
}

if (failures.length > 0) {
  console.error('Documentation checks failed.')
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Documentation checks passed for ${markdownFiles.length} files.`)
}
