// SPDX-License-Identifier: Apache-2.0

import { copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const packageDirectory = resolve(process.cwd())

await Promise.all([
  copyFile(resolve(repositoryRoot, 'LICENSE'), resolve(packageDirectory, 'LICENSE')),
  copyFile(resolve(repositoryRoot, 'NOTICE'), resolve(packageDirectory, 'NOTICE')),
])
