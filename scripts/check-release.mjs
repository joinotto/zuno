// SPDX-License-Identifier: Apache-2.0

import console from 'node:console'
import { readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const packageDirectories = await findPackageDirectories()
const rootPackage = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const releaseWorkflow = await readFile(join(root, '.github/workflows/release.yml'), 'utf8')
const failures = []
const names = new Set()
const requiredPackageFiles = [
  'LICENSE',
  'NOTICE',
  'README.md',
  'dist/index.d.ts',
  'dist/index.js',
  'package.json',
]

for (const directory of packageDirectories) {
  const packagePath = join(directory, 'package.json')
  const packageData = JSON.parse(await readFile(packagePath, 'utf8'))
  const label = relative(root, directory)

  check(packageData.name?.startsWith('@ottoai/'), label, 'Package name must use @ottoai.')
  check(!names.has(packageData.name), label, 'Package name must be unique.')
  check(packageData.version !== '0.0.0', label, 'Package version must not be 0.0.0.')
  check(packageData.license === 'Apache-2.0', label, 'Package license must be Apache-2.0.')
  check(packageData.type === 'module', label, 'Package type must be module.')
  check(packageData.private !== true, label, 'Public package must not be private.')
  check(packageData.publishConfig?.access === 'public', label, 'Package access must be public.')
  check(
    packageData.repository?.url === 'https://github.com/joinotto/zuno',
    label,
    'Package repository URL must match the trusted publisher repository.',
  )
  check(packageData.exports?.['.'] !== undefined, label, 'Package must export its main entry.')

  if (typeof packageData.name === 'string') {
    names.add(packageData.name)
  }

  validateTarball(directory, label)
}

check(
  /^\s+NPM_CONFIG_PROVENANCE:\s+true\s*$/mu.test(releaseWorkflow),
  '.github/workflows/release.yml',
  'Release workflow must enable package provenance.',
)
check(
  /^\s+id-token:\s+write\s*$/mu.test(releaseWorkflow),
  '.github/workflows/release.yml',
  'Release workflow must allow an OIDC identity token.',
)
check(
  /^\s+environment:\s+npm\s*$/mu.test(releaseWorkflow),
  '.github/workflows/release.yml',
  'Release workflow must use the npm environment.',
)
check(
  !/registry-url|NODE_AUTH_TOKEN|NPM_TOKEN/u.test(releaseWorkflow),
  '.github/workflows/release.yml',
  'Release workflow must not configure token-based npm authentication.',
)
check(
  rootPackage.scripts?.release === 'pnpm build && node scripts/publish-packages.mjs',
  'package.json',
  'Release script must use the direct npm publisher.',
)

if (failures.length > 0) {
  console.error('Release validation failed.')
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Release validation passed for ${packageDirectories.length} packages.`)
}

async function findPackageDirectories() {
  const directories = []

  for (const parent of ['packages', 'providers']) {
    const parentPath = resolve(root, parent)
    const entries = await readdir(parentPath, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory()) {
        directories.push(join(parentPath, entry.name))
      }
    }
  }

  return directories
}

function validateTarball(directory, label) {
  const result = spawnSync('npm', ['pack', '--dry-run', '--ignore-scripts', '--json'], {
    cwd: directory,
    encoding: 'utf8',
    env: {
      ...process.env,
      NPM_CONFIG_CACHE: process.env.NPM_CONFIG_CACHE ?? join(tmpdir(), 'zuno-npm-cache'),
    },
  })

  if (result.status !== 0) {
    failures.push(`${label}: npm pack failed: ${result.stderr.trim()}`)
    return
  }

  const output = JSON.parse(result.stdout)
  const pack = findPackageMetadata(output)

  if (pack === undefined) {
    failures.push(`${label}: npm pack returned no package metadata.`)
    return
  }

  const files = new Set(pack.files.map((file) => file.path))

  for (const file of requiredPackageFiles) {
    check(files.has(file), label, `Tarball must contain ${file}.`)
  }

  check(pack.unpackedSize < 2_000_000, label, 'Tarball must be smaller than 2 MB unpacked.')
  check(
    [...files].every((file) => !file.startsWith('src/') && !file.startsWith('test/')),
    label,
    'Tarball must not contain source or test directories.',
  )
}

function findPackageMetadata(output) {
  if (Array.isArray(output)) {
    return output.find(hasPackageFiles)
  }

  if (hasPackageFiles(output)) {
    return output
  }

  if (typeof output === 'object' && output !== null) {
    return Object.values(output).find(hasPackageFiles)
  }

  return undefined
}

function hasPackageFiles(value) {
  return (
    typeof value === 'object' && value !== null && 'files' in value && Array.isArray(value.files)
  )
}

function check(condition, label, message) {
  if (!condition) {
    failures.push(`${label}: ${message}`)
  }
}
