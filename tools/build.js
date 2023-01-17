/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

const fs = require('fs')
const cp = require('child_process')
const rollup = require('rollup')
const sourcemaps = require('rollup-plugin-sourcemaps')
const babel = require('rollup-plugin-babel')
const { uglify } = require('rollup-plugin-uglify')
const commonjs = require('@rollup/plugin-commonjs')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const pkg = require('../package.json')

// The source files to be compiled by Rollup
const files = [
  {
    input: 'dist/src/UniversalRouter.js',
    output: 'dist/index.js',
    format: 'cjs',
    external: ['path-to-regexp'],
  },
  {
    input: 'dist/src/UniversalRouter.js',
    output: 'dist/module.js',
    format: 'es',
    external: ['path-to-regexp'],
  },
  {
    input: 'dist/src/UniversalRouter.js',
    output: 'dist/universal-router.js',
    format: 'umd',
    name: 'UniversalRouter',
    external: [],
  },
  {
    input: 'dist/src/UniversalRouter.js',
    output: 'dist/universal-router.min.js',
    format: 'umd',
    name: 'UniversalRouter',
    external: [],
  },

  // sync add-on
  {
    input: 'dist/src/UniversalRouterSync.js',
    output: 'dist/sync/index.js',
    format: 'cjs',
    external: ['path-to-regexp'],
  },
  {
    input: 'dist/src/UniversalRouterSync.js',
    output: 'dist/sync/module.js',
    format: 'es',
    external: ['path-to-regexp'],
  },
  {
    input: 'dist/src/UniversalRouterSync.js',
    output: 'dist/universal-router-sync.js',
    format: 'umd',
    name: 'UniversalRouterSync',
    external: [],
  },
  {
    input: 'dist/src/UniversalRouterSync.js',
    output: 'dist/universal-router-sync.min.js',
    format: 'umd',
    name: 'UniversalRouterSync',
    external: [],
  },

  // generateUrls add-on
  {
    input: 'dist/src/generateUrls.js',
    output: 'dist/generateUrls/index.js',
    format: 'cjs',
    external: ['path-to-regexp'],
  },
  {
    input: 'dist/src/generateUrls.js',
    output: 'dist/generateUrls/module.js',
    format: 'es',
    external: ['path-to-regexp'],
  },
  {
    input: 'dist/src/generateUrls.js',
    output: 'dist/universal-router-generate-urls.js',
    format: 'umd',
    name: 'generateUrls',
    external: [],
  },
  {
    input: 'dist/src/generateUrls.js',
    output: 'dist/universal-router-generate-urls.min.js',
    format: 'umd',
    name: 'generateUrls',
    external: [],
  },
]

async function build() {
  // Clean up the output directory
  fs.rmdirSync('dist', { recursive: true })
  fs.mkdirSync('dist/src', { recursive: true })
  fs.mkdirSync('dist/sync', { recursive: true })
  fs.mkdirSync('dist/generateUrls', { recursive: true })

  // Copy source code, readme and license
  fs.copyFileSync('src/generateUrls.ts', 'dist/src/generateUrls.ts')
  fs.copyFileSync('src/UniversalRouter.ts', 'dist/src/UniversalRouter.ts')
  fs.copyFileSync('src/UniversalRouterSync.ts', 'dist/src/UniversalRouterSync.ts')
  fs.copyFileSync('README.md', 'dist/README.md')
  fs.copyFileSync('LICENSE.txt', 'dist/LICENSE.txt')

  // Compile .ts to .js
  cp.execSync('npm run prebuild')

  // Compile source code into a distributable format with Babel
  await Promise.all(
    files.map(async (file) => {
      const bundle = await rollup.rollup({
        input: file.input,
        external: file.external,
        plugins: [
          ...(file.format === 'umd' ? [nodeResolve({ browser: true }), commonjs()] : []),
          sourcemaps(),
          babel({
            babelrc: false,
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
            ],
            comments: false,
          }),
          ...(file.output.endsWith('.min.js') ? [uglify({ output: { comments: '/^!/' } })] : []),
        ],
      })

      bundle.write({
        file: file.output,
        format: file.format,
        exports: 'default',
        interop: false,
        sourcemap: true,
        name: file.name,
        banner:
          '/*! Universal Router | MIT License | https://www.kriasoft.com/universal-router/ */\n',
        globals: file.globals,
      })
    }),
  )

  // Create package.json for npm publishing
  const libPkg = { ...pkg }
  delete libPkg.private
  delete libPkg.devDependencies
  delete libPkg.scripts
  fs.writeFileSync('dist/package.json', JSON.stringify(libPkg, null, 2))

  // Create sync/package.json for convenient import
  const syncPkg = {
    ...pkg,
    name: 'sync',
    description: 'Universal Router Sync Add-on',
    types: '../src/UniversalRouterSync.d.ts',
  }
  delete syncPkg.dependencies
  delete syncPkg.devDependencies
  delete syncPkg.scripts
  fs.writeFileSync('dist/sync/package.json', JSON.stringify(syncPkg, null, 2))

  // Create generateUrls/package.json for convenient import
  const generateUrlsPkg = {
    ...pkg,
    name: 'generateUrls',
    description: 'Universal Router Generate URLs Add-on',
    types: '../src/generateUrls.d.ts',
  }
  delete generateUrlsPkg.dependencies
  delete generateUrlsPkg.devDependencies
  delete generateUrlsPkg.scripts
  fs.writeFileSync('dist/generateUrls/package.json', JSON.stringify(generateUrlsPkg, null, 2))
}

module.exports = build()
