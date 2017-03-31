/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

const cp = require('child_process');
const fs = require('fs');
const del = require('del');
const path = require('path');
const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const uglify = require('rollup-plugin-uglify');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const pkg = require('../package.json');

const moduleName = 'UniversalRouter';
const addons = [
  {
    name: 'generate-urls',
    moduleName: 'generateUrls',
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
    presets: [['es2015', { modules: false }]],
  },
  {
    format: 'cjs',
    ext: '.js',
    output: 'browser',
    presets: [['es2015', { modules: false }]],
  },
  {
    format: 'es',
    ext: '.mjs',
    output: 'browser',
    presets: [['es2015', { modules: false }]],
  },
  {
    format: 'umd',
    ext: '.js',
    presets: [['es2015', { modules: false }]],
    output: pkg.name,
    moduleName,
    external: [],
  },
  {
    format: 'umd',
    ext: '.min.js',
    presets: [['es2015', { modules: false }]],
    output: pkg.name,
    moduleName,
    external: [],
    minify: true,
  },
];

addons.forEach((addon) => {
  files.push(...files.map(file =>
    Object.assign({}, file, {
      entry: `src/${addon.moduleName}.js`,
      basePath: file.format === 'umd' ? '' : `/${addon.moduleName}`,
      output: file.output === pkg.name ? `${pkg.name}-${addon.name}` : file.output,
      moduleName: file.moduleName ? addon.moduleName : null,
      external: Object.keys(pkg.dependencies).concat([path.resolve('src/Router.js')]),
    })
  ));
});

let promise = Promise.resolve();

// Clean up the output directory
promise = promise.then(() => del(['dist/*']));

// Compile source code into a distributable format with Babel
files.forEach((file) => {
  promise = promise.then(() => rollup.rollup({
    entry: file.entry || 'src/Router.js',
    external: file.external || Object.keys(pkg.dependencies),
    plugins: [
      ...file.format === 'umd' ? [nodeResolve({ browser: true }), commonjs()] : [],
      babel({
        babelrc: false,
        exclude: 'node_modules/**',
        runtimeHelpers: true,
        presets: file.presets,
        plugins: file.plugins,
      }),
      ...file.minify ? [uglify({ output: { comments: '/^!/' } })] : [],
    ],
    paths: {
      [path.resolve('src/Router.js')]: file.format === 'umd' ? `./${pkg.name}${file.ext}` : '..',
    },
  }).then(bundle => bundle.write({
    dest: `dist${file.basePath || ''}/${file.output}${file.ext}`,
    format: file.format,
    sourceMap: true,
    exports: 'default',
    moduleName: file.moduleName,
    banner: '/*! Universal Router | MIT License | https://www.kriasoft.com/universal-router/ */\n',
    globals: {
      [path.resolve('src/Router.js')]: moduleName,
    },
  })));
});

// Copy package.json and LICENSE.txt
promise = promise.then(() => {
  delete pkg.private;
  delete pkg.devDependencies;
  delete pkg.scripts;
  delete pkg.eslintConfig;
  delete pkg.babel;
  delete pkg.preCommit;
  fs.writeFileSync('dist/package.json', JSON.stringify(pkg, null, '  '), 'utf-8');
  addons.forEach((addon) => {
    const p = Object.assign({}, pkg, {
      private: true,
      name: addon.moduleName,
      description: addon.description,
    });
    delete p.dependencies;
    fs.writeFileSync(`dist/${addon.moduleName}/package.json`, JSON.stringify(p, null, '  '), 'utf-8');
  });
  fs.writeFileSync('dist/README.md', fs.readFileSync('README.md', 'utf-8'), 'utf-8');
  fs.writeFileSync('dist/LICENSE.txt', fs.readFileSync('LICENSE.txt', 'utf-8'), 'utf-8');
  cp.spawnSync('git', ['add', 'dist/universal-router*']);
});

promise.catch(err => console.error(err.stack));
