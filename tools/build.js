/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

const fs = require('fs-extra')
const path = require('path')
const rollup = require('rollup')
const babel = require('rollup-plugin-babel')
const { uglify } = require('rollup-plugin-uglify')
const commonjs = require('rollup-plugin-commonjs')
const nodeResolve = require('rollup-plugin-node-resolve')
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
    external: ['path-to-regexp', path.resolve('dist/src/UniversalRouter.js')],
    paths: { [path.resolve('dist/src/UniversalRouter.js')]: '..' },
  },
  {
    input: 'dist/src/generateUrls.js',
    output: 'dist/generateUrls/module.js',
    format: 'es',
    external: ['path-to-regexp', path.resolve('dist/src/UniversalRouter.js')],
    paths: { [path.resolve('dist/src/UniversalRouter.js')]: '..' },
  },
  {
    input: 'dist/src/generateUrls.js',
    output: 'dist/universal-router-generate-urls.js',
    format: 'umd',
    name: 'generateUrls',
    external: ['path-to-regexp', './UniversalRouter'],
    paths: { [path.resolve('dist/src/UniversalRouter')]: './universal-router.js' },
    globals: { [path.resolve('dist/src/UniversalRouter')]: 'UniversalRouter' },
  },
  {
    input: 'dist/src/generateUrls.js',
    output: 'dist/universal-router-generate-urls.min.js',
    format: 'umd',
    name: 'generateUrls',
    external: ['path-to-regexp', './UniversalRouter'],
    paths: { [path.resolve('dist/src/UniversalRouter')]: './universal-router.min.js' },
    globals: { [path.resolve('dist/src/UniversalRouter')]: 'UniversalRouter' },
  },
]

async function build() {
  // Clean up the output directory
  await fs.emptyDir('dist')

  // Copy source code, readme and license
  await Promise.all([
    fs.copy('src', 'dist/src'),
    fs.copy('README.md', 'dist/README.md'),
    fs.copy('LICENSE.txt', 'dist/LICENSE.txt'),
  ])

  // Compile source code into a distributable format with Babel
  await Promise.all(
    files.map(async (file) => {
      const bundle = await rollup.rollup({
        input: file.input,
        external: file.external,
        plugins: [
          ...(file.format === 'umd' ? [nodeResolve({ browser: true }), commonjs()] : []),
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
        interop: false,
        sourcemap: true,
        name: file.name,
        banner:
          '/*! Universal Router | MIT License | https://www.kriasoft.com/universal-router/ */\n',
        globals: file.globals,
        paths: file.paths,
      })
    }),
  )

  // Create package.json for npm publishing
  const libPkg = { ...pkg }
  delete libPkg.private
  delete libPkg.devDependencies
  delete libPkg.scripts
  await fs.outputJson('dist/package.json', libPkg, { spaces: 2 })

  // Create sync/package.json for convenient import
  const syncPkg = {
    ...pkg,
    name: 'sync',
    description: 'Universal Router Sync Add-on',
    esnext: '../src/UniversalRouterSync.js',
    types: '../src/UniversalRouterSync.d.ts',
  }
  delete syncPkg.dependencies
  delete syncPkg.devDependencies
  delete syncPkg.scripts
  await fs.outputJson('dist/sync/package.json', syncPkg, { spaces: 2 })

  // Create generateUrls/package.json for convenient import
  const generateUrlsPkg = {
    ...pkg,
    name: 'generateUrls',
    description: 'Universal Router Generate URLs Add-on',
    esnext: '../src/generateUrls.js',
    types: '../src/generateUrls.d.ts',
  }
  delete generateUrlsPkg.dependencies
  delete generateUrlsPkg.devDependencies
  delete generateUrlsPkg.scripts
  await fs.outputJson('dist/generateUrls/package.json', generateUrlsPkg, { spaces: 2 })
}

module.exports = build()
