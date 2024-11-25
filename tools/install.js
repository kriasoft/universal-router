/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const [, , urlArg] = process.argv

if (!urlArg) {
  console.error('Usage: node tools/install.js <url>')
  process.exit(1)
}

// We're downloading path-to-regexp directly from GitHub because the ESM version
// is not available in the npm package. See the issue for more details:
// https://github.com/pillarjs/path-to-regexp/issues/346

const url = new URL(urlArg)
const filename = 'src/path-to-regexp.ts'
const outputPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../',
  filename,
)

try {
  const res = await fetch(url)
  if (!res.ok)
    throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`)

  const content = await res.text()
  const result =
    `/*! Path-to-RegExp | MIT License | https://github.com/pillarjs/path-to-regexp */` +
    `// @ts-nocheck\n\n${content}`

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, result, 'utf8')
} catch (err) {
  console.error(`Install failed: ${err.message}`)
  process.exit(1)
}
