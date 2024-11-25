/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

const fs = require('fs/promises')
const cp = require('child_process')
const { rollup } = require('rollup')
const babel = require('@rollup/plugin-babel')
const terser = require('@rollup/plugin-terser')
const commonjs = require('@rollup/plugin-commonjs')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const pkg = require('../package.json')

// The source files to be compiled by Rollup
const files = [
  {
    input: 'dist/src/UniversalRouter.ts',
    output: 'dist/index.js',
    format: 'cjs',
    external: ['path-to-regexp'],
  },
  {
    input: 'dist/src/UniversalRouter.ts',
    output: 'dist/module.js',
    format: 'es',
    external: ['path-to-regexp'],
  },
  {
    input: 'dist/src/UniversalRouter.ts',
    output: 'dist/universal-router.js',
    format: 'umd',
    name: 'UniversalRouter',
    external: [],
  },
  {
    input: 'dist/src/UniversalRouter.ts',
    output: 'dist/universal-router.min.js',
    format: 'umd',
    name: 'UniversalRouter',
    external: [],
  },

  // sync add-on
  {
    input: 'dist/src/UniversalRouterSync.ts',
    output: 'dist/sync/index.js',
    format: 'cjs',
    external: ['path-to-regexp'],
  },
  {
    input: 'dist/src/UniversalRouterSync.ts',
    output: 'dist/sync/module.js',
    format: 'es',
    external: ['path-to-regexp'],
  },
  {
    input: 'dist/src/UniversalRouterSync.ts',
    output: 'dist/universal-router-sync.js',
    format: 'umd',
    name: 'UniversalRouterSync',
    external: [],
  },
  {
    input: 'dist/src/UniversalRouterSync.ts',
    output: 'dist/universal-router-sync.min.js',
    format: 'umd',
    name: 'UniversalRouterSync',
    external: [],
  },

  // generateUrls add-on
  {
    input: 'dist/src/generateUrls.ts',
    output: 'dist/generateUrls/index.js',
    format: 'cjs',
    external: ['path-to-regexp'],
  },
  {
    input: 'dist/src/generateUrls.ts',
    output: 'dist/generateUrls/module.js',
    format: 'es',
    external: ['path-to-regexp'],
  },
  {
    input: 'dist/src/generateUrls.ts',
    output: 'dist/universal-router-generate-urls.js',
    format: 'umd',
    name: 'generateUrls',
    external: [],
  },
  {
    input: 'dist/src/generateUrls.ts',
    output: 'dist/universal-router-generate-urls.min.js',
    format: 'umd',
    name: 'generateUrls',
    external: [],
  },
]

async function build() {
  try {
    // Clean up the output directory
    await fs.rm('dist', { recursive: true, force: true })
    await fs.mkdir('dist/src', { recursive: true })
    await fs.mkdir('dist/sync', { recursive: true })
    await fs.mkdir('dist/generateUrls', { recursive: true })

    // Copy source code, readme and license
    await Promise.all([
      fs.copyFile('src/generateUrls.ts', 'dist/src/generateUrls.ts'),
      fs.copyFile('src/UniversalRouter.ts', 'dist/src/UniversalRouter.ts'),
      fs.copyFile(
        'src/UniversalRouterSync.ts',
        'dist/src/UniversalRouterSync.ts',
      ),
      fs.copyFile('README.md', 'dist/README.md'),
      fs.copyFile('LICENSE.txt', 'dist/LICENSE.txt'),
    ])

    // Compile .ts to .js
    cp.execSync('tsc --project tools/build.tsconfig.json', { stdio: 'inherit' })

    // Compile source code into a distributable format
    await Promise.all(
      files.map(async (file) => {
        const bundle = await rollup({
          input: file.input,
          external: file.external,
          plugins: [
            ...(file.format === 'umd'
              ? [
                  nodeResolve({ browser: true, preferBuiltins: true }),
                  commonjs(),
                ]
              : []),
            babel({
              extensions: ['.js', '.ts'],
              babelrc: false,
              babelHelpers: 'bundled',
              presets: [
                [
                  '@babel/preset-env',
                  {
                    modules: false,
                    loose: true,
                    useBuiltIns: 'entry',
                    corejs: 3,
                  },
                ],
                '@babel/preset-typescript',
              ],
              comments: false,
            }),
            ...(file.output.endsWith('.min.js')
              ? [terser({ format: { comments: /^!/ } })]
              : []),
          ],
        })

        await bundle.write({
          file: file.output,
          format: file.format,
          exports: 'default',
          generatedCode: {
            preset: 'es2015',
          },
          sourcemap: true,
          name: file.name,
          banner:
            '/*! Universal Router | MIT License | https://www.kriasoft.com/universal-router/ */\n',
          globals: file.globals,
        })

        await bundle.close()
      }),
    )

    // Create package.json files
    const createPackageJson = async (path, modifications) => {
      const { private, scripts, devDependencies, ...basePkg } = pkg
      await fs.writeFile(
        path,
        JSON.stringify(
          {
            ...basePkg,
            ...modifications,
          },
          null,
          2,
        ),
      )
    }

    await Promise.all([
      createPackageJson('dist/package.json'),
      createPackageJson('dist/sync/package.json', {
        name: 'sync',
        description: 'Universal Router Sync Add-on',
        types: '../src/UniversalRouterSync.d.ts',
      }),
      createPackageJson('dist/generateUrls/package.json', {
        name: 'generateUrls',
        description: 'Universal Router Generate URLs Add-on',
        types: '../src/generateUrls.d.ts',
      }),
    ])
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}

module.exports = build()
