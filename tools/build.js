/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

'use strict';

const fs = require('fs');
const del = require('del');
const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const uglify = require('rollup-plugin-uglify');
const pkg = require('../package.json');

// The source files to be compiled by Rollup
const files = [
  {
    format: 'cjs', ext: '.js',
    presets: ['stage-1'], plugins: [
      'transform-es2015-destructuring',
      'transform-es2015-function-name',
      'transform-es2015-parameters',
      'external-helpers',
      'transform-runtime',
    ],
  },
  {
    format: 'es6', ext: '.mjs',
    presets: ['stage-1'], plugins: [
      'transform-es2015-destructuring',
      'transform-es2015-function-name',
      'transform-es2015-parameters',
      'external-helpers',
      'transform-runtime',
    ],
  },
  {
    format: 'cjs', ext: '.js', output: 'legacy',
    presets: ['es2015-rollup', 'stage-1'], plugins: ['transform-runtime'],
  },
  {
    format: 'cjs', ext: '.js', output: 'browser',
    presets: ['es2015-rollup', 'stage-1'], plugins: ['transform-runtime'],
  },
  {
    format: 'es6', ext: '.mjs', output: 'browser',
    presets: ['es2015-rollup', 'stage-1'], plugins: ['transform-runtime'],
  },
  {
    format: 'umd', ext: '.js',
    presets: ['es2015-rollup', 'stage-1'], plugins: ['transform-runtime'],
    output: pkg.name, moduleName: 'UniversalRouter',
  },
  {
    format: 'umd', ext: '.min.js',
    presets: ['es2015-rollup', 'stage-1'], plugins: ['transform-runtime'],
    output: pkg.name, moduleName: 'UniversalRouter', minify: true,
  },
];

let promise = Promise.resolve();

// Clean up the output directory
promise = promise.then(() => del(['build/*']));

// Compile source code into a distributable format with Babel
for (const file of files) {
  promise = promise.then(() => rollup.rollup({
    entry: 'src/main.js',
    external: Object.keys(pkg.dependencies),
    plugins: [
      babel(Object.assign(pkg.babel, {
        babelrc: false,
        exclude: 'node_modules/**',
        runtimeHelpers: true,
        presets: file.presets,
        plugins: file.plugins,
      })),
    ].concat(file.minify ? [uglify()] : []),
  }).then(bundle => bundle.write({
    dest: `build/${file.output || 'main'}${file.ext}`,
    format: file.format,
    sourceMap: !file.minify,
    moduleName: file.moduleName,
  })));
}

// Copy package.json and LICENSE.txt
promise = promise.then(() => {
  delete pkg.private;
  delete pkg.devDependencies;
  delete pkg.scripts;
  delete pkg.eslintConfig;
  delete pkg.babel;
  fs.writeFileSync('build/package.json', JSON.stringify(pkg, null, '  '), 'utf-8');
  fs.writeFileSync('build/README.md', fs.readFileSync('README.md', 'utf-8'), 'utf-8');
  fs.writeFileSync('build/LICENSE.txt', fs.readFileSync('LICENSE.txt', 'utf-8'), 'utf-8');
});

promise.catch(err => console.error(err.stack)); // eslint-disable-line no-console
