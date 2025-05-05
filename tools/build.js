/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import fs from 'node:fs/promises'
import cp from 'node:child_process'

async function build() {
  try {
    // Clean up the output directory
    await fs.rm('dist', { recursive: true, force: true })
    await fs.mkdir('dist', { recursive: true })

    // Copy source code, readme and license
    await Promise.all([
      fs.copyFile('README.md', 'dist/README.md'),
      fs.copyFile('LICENSE.txt', 'dist/LICENSE.txt'),
    ])

    // Compile .ts to .js
    cp.execSync('tsc --project tools/tsconfig.esm.json', { stdio: 'inherit' })
    cp.execSync('tsc --project tools/tsconfig.cjs.json', { stdio: 'inherit' })

    // Create package.json file
    const pkg = await fs.readFile('package.json', 'utf8')
    await fs.writeFile(
      'dist/package.json',
      JSON.stringify(
        {
          ...JSON.parse(pkg),
          private: undefined,
          scripts: undefined,
          devDependencies: undefined,
        },
        null,
        2,
      ),
    )
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}

await build()
