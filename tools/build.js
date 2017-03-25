/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-present Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

const fs = require('fs');
const del = require('del');
const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const uglify = require('rollup-plugin-uglify');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const pkg = require('../package.json');

// The source files to be compiled by Rollup
let files = [
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
    presets: [['latest', { es2015: { modules: false } }]],
  },
  {
    format: 'cjs',
    ext: '.js',
    output: 'browser',
    presets: [['latest', { es2015: { modules: false } }]],
  },
  {
    format: 'es',
    ext: '.mjs',
    output: 'browser',
    presets: [['latest', { es2015: { modules: false } }]],
  },
  {
    format: 'umd',
    ext: '.js',
    presets: [['latest', { es2015: { modules: false } }]],
    output: pkg.name,
    moduleName: 'UniversalRouter',
  },
  {
    format: 'umd',
    ext: '.min.js',
    presets: [['latest', { es2015: { modules: false } }]],
    output: pkg.name,
    moduleName: 'UniversalRouter',
    minify: true,
  },
];

// Compile generateUrls module
files = files.concat(files.map(file => Object.assign({}, file, {
  entry: 'src/generateUrls.js',
  output: file.output === pkg.name ? `${pkg.name}-generate-urls` : `generateUrls/${file.output}`,
  moduleName: file.moduleName && 'generateUrls',
})));

let promise = Promise.resolve();

// Clean up the output directory
promise = promise.then(() => del(['build/*']));

// Compile source code into a distributable format with Babel
files.forEach((file) => {
  promise = promise.then(() => rollup.rollup({
    entry: file.entry || 'src/Router.js',
    external: file.format === 'umd' ? [] : Object.keys(pkg.dependencies),
    plugins: [
      ...file.format === 'umd' ? [nodeResolve({ browser: true }), commonjs()] : [],
      babel({
        babelrc: false,
        exclude: 'node_modules/**',
        runtimeHelpers: true,
        presets: file.presets,
        plugins: file.plugins,
      }),
      ...file.minify ? [uglify()] : [],
    ],
  }).then(bundle => bundle.write({
    dest: `build/${file.output}${file.ext}`,
    format: file.format,
    sourceMap: !file.minify,
    exports: 'default',
    moduleName: file.moduleName,
  })));
});

// Copy package.json and LICENSE.txt
promise = promise.then(() => {
  delete pkg.devDependencies;
  delete pkg.scripts;
  delete pkg.eslintConfig;
  delete pkg.babel;
  const pkg2 = Object.assign({}, pkg, {
    name: 'generateUrls',
    description: 'Universal Router extension for URLs generation',
  });
  delete pkg.private;
  delete pkg2.dependencies;
  fs.writeFileSync('build/package.json', JSON.stringify(pkg, null, '  '), 'utf-8');
  fs.writeFileSync('build/generateUrls/package.json', JSON.stringify(pkg2, null, '  '), 'utf-8');
  fs.writeFileSync('build/README.md', fs.readFileSync('README.md', 'utf-8'), 'utf-8');
  fs.writeFileSync('build/LICENSE.txt', fs.readFileSync('LICENSE.txt', 'utf-8'), 'utf-8');
});

promise.catch(err => console.error(err.stack)); // eslint-disable-line no-console
