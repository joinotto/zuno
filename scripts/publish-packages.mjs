// SPDX-License-Identifier: Apache-2.0

import console from 'node:console'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { get } from 'node:https'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dryRun = process.argv.includes('--dry-run')
const packageDirectories = [
  'packages/core',
  'packages/oauth',
  'packages/testing',
  'providers/quickbooks',
  'providers/plaid',
]

for (const relativeDirectory of packageDirectories) {
  const directory = resolve(root, relativeDirectory)
  const packageData = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))
  const packageLabel = `${packageData.name}@${packageData.version}`

  if (await packageVersionExists(packageData.name, packageData.version)) {
    console.log(`Skip ${packageLabel}. The version is already published.`)
    continue
  }

  const archiveDirectory = await mkdtemp(join(tmpdir(), 'zuno-publish-'))

  try {
    run('pnpm', ['--dir', directory, 'pack', '--pack-destination', archiveDirectory])

    const archives = (await readdir(archiveDirectory)).filter((file) => file.endsWith('.tgz'))

    if (archives.length !== 1) {
      throw new Error(`Expected one package archive for ${packageLabel}.`)
    }

    const archive = join(archiveDirectory, archives[0])
    const tag = releaseTag(packageData.version)

    if (dryRun) {
      console.log(`Would publish ${packageLabel} with the ${tag} tag.`)
      continue
    }

    run('npm', [
      'publish',
      archive,
      '--access',
      'public',
      '--tag',
      tag,
      '--provenance',
      '--loglevel',
      'verbose',
    ])
  } finally {
    await rm(archiveDirectory, { force: true, recursive: true })
  }
}

async function packageVersionExists(name, version) {
  const packagePath = encodeURIComponent(name)
  const versionPath = encodeURIComponent(version)
  const status = await registryStatus(`https://registry.npmjs.org/${packagePath}/${versionPath}`)

  if (status >= 200 && status < 300) {
    return true
  }

  if (status === 404) {
    return false
  }

  throw new Error(`npm registry returned ${status} for ${name}@${version}.`)
}

function registryStatus(url) {
  return new Promise((resolveStatus, rejectStatus) => {
    const request = get(url, (response) => {
      response.resume()
      resolveStatus(response.statusCode ?? 0)
    })

    request.setTimeout(15_000, () => {
      request.destroy(new Error('npm registry request timed out.'))
    })
    request.on('error', rejectStatus)
  })
}

function releaseTag(version) {
  const prerelease = version.match(/-([0-9A-Za-z-]+)/u)?.[1]
  return prerelease ?? 'latest'
}

function run(command, arguments_) {
  const result = spawnSync(command, arguments_, {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
  })

  if (result.error !== undefined) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status}.`)
  }
}
