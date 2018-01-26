/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

process.on('unhandledRejection', (error) => {
  throw error;
});

const fs = require('fs-extra');
const path = require('path');
const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const uglify = require('rollup-plugin-uglify');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const pkg = require('../package.json');

const name = 'UniversalRouter';
const addons = [
  {
    file: 'generate-urls',
    name: 'generateUrls',
    description: 'Universal Router Generate URLs Add-on',
  },
];

// The source files to be compiled by Rollup
const files = [
  {
    format: 'cjs',
    ext: '.js',
    output: 'main',
  },
  {
    format: 'es',
    ext: '.mjs',
    output: 'main',
  },
  {
    format: 'cjs',
    ext: '.js',
    output: 'legacy',
    presets: [['env', { modules: false }]],
  },
  {
    format: 'cjs',
    ext: '.js',
    output: 'browser',
    presets: [['env', { modules: false }]],
  },
  {
    format: 'es',
    ext: '.mjs',
    output: 'browser',
    presets: [['env', { modules: false }]],
  },
  {
    format: 'umd',
    ext: '.js',
    presets: [['env', { modules: false }]],
    output: pkg.name,
    name,
    external: [],
  },
  {
    format: 'umd',
    ext: '.min.js',
    presets: [['env', { modules: false }]],
    output: pkg.name,
    name,
    external: [],
    minify: true,
  },
];

addons.forEach((addon) => {
  files.push(
    ...files.map((file) =>
      Object.assign({}, file, {
        input: `dist/src/${addon.name}.js`,
        basePath: file.format === 'umd' ? '' : `/${addon.name}`,
        output: file.output === pkg.name ? `${pkg.name}-${addon.file}` : file.output,
        name: file.name ? addon.name : null,
        external: Object.keys(pkg.dependencies).concat([
          path.resolve('dist/src/UniversalRouter.js'),
        ]),
      }),
    ),
  );
});

async function run() {
  // Clean up the output directory
  await fs.remove('dist');

  // Copy source code, package.json and LICENSE.txt
  await Promise.all([
    fs.copy('src', 'dist/src'),
    fs.copy('README.md', 'dist/README.md'),
    fs.copy('LICENSE.txt', 'dist/LICENSE.txt'),
  ]);

  // Compile source code into a distributable format with Babel
  await Promise.all(
    files.map(async (file) => {
      const bundle = await rollup.rollup({
        input: file.input || 'dist/src/UniversalRouter.js',
        external: file.external || Object.keys(pkg.dependencies),
        plugins: [
          ...(file.format === 'umd' ? [nodeResolve({ browser: true }), commonjs()] : []),
          babel({
            babelrc: false,
            exclude: 'node_modules/**',
            presets: file.presets,
            plugins: file.plugins,
          }),
          ...(file.minify ? [uglify({ output: { comments: '/^!/' } })] : []),
        ],
      });

      bundle.write({
        file: `dist${file.basePath || ''}/${file.output}${file.ext}`,
        format: file.format,
        sourcemap: true,
        exports: 'default',
        name: file.name,
        banner:
          '/*! Universal Router | MIT License | https://www.kriasoft.com/universal-router/ */\n',
        globals: {
          [path.resolve('dist/src/UniversalRouter.js')]: name,
        },
        paths: {
          [path.resolve('dist/src/UniversalRouter.js')]:
            file.format === 'umd' ? `./${pkg.name}${file.ext}` : '..',
        },
      });
    }),
  );

  const libPkg = Object.assign({}, pkg);
  delete libPkg.private;
  delete libPkg.devDependencies;
  delete libPkg.scripts;
  await fs.outputJson('dist/package.json', libPkg, { spaces: 2 });

  await Promise.all(
    addons.map((addon) => {
      const addonPkg = Object.assign({}, pkg, {
        name: addon.name,
        description: addon.description,
        esnext: `../src/${addon.name}.js`,
      });
      delete addonPkg.dependencies;
      delete addonPkg.devDependencies;
      delete addonPkg.scripts;
      return fs.outputJson(`dist/${addon.name}/package.json`, addonPkg, { spaces: 2 });
    }),
  );
}

module.exports = run();
