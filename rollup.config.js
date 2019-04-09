import { resolve } from 'path';
import sourceMaps from 'rollup-plugin-sourcemaps';
import nodeResolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import { uglify } from 'rollup-plugin-uglify';
import { terser } from 'rollup-plugin-terser';
import { getIfUtils, removeEmpty } from 'webpack-config-utils';

import pkg from './package.json';
const { pascalCase, normalizePackageName, getOutputFileName } = require('./config/helpers');

/**
 * @typedef {import('./config/types').RollupConfig} Config
 */
/**
 * @typedef {import('./config/types').RollupPlugin} Plugin
 */

const env = process.env.NODE_ENV || 'development';
const { ifProduction } = getIfUtils(env);

const LIB_NAME = pascalCase(normalizePackageName(pkg.name));
const ROOT = resolve(__dirname);
const DIST = resolve(ROOT, 'dist');

/**
 * Object literals are open-ended for js checking, so we need to be explicit
 * @type {{entry:{esm5: string, esm2015: string},bundles:string}}
 */
const PATHS = {
  entry: {
    esm5: resolve(DIST, 'esm5'),
    esm2015: resolve(DIST, 'esm2015'),
  },
  bundles: resolve(DIST, 'bundles'),
};

/**
 * @type {string[]}
 */
const external = Object.keys(pkg.peerDependencies) || [];

/**
 *  @type {Plugin[]}
 */
const plugins = /** @type {Plugin[]} */ ([
  // Allow json resolution
  json(),

  // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
  commonjs(),

  // Allow node_modules resolution, so you can use 'external' to control
  // which external modules to include in the bundle
  // https://github.com/rollup/rollup-plugin-node-resolve#usage
  nodeResolve(),

  // Resolve source maps to the original source
  sourceMaps(),

  // properly set process.env.NODE_ENV within `./environment.ts`
  replace({
    exclude: 'node_modules/**',
    'process.env.NODE_ENV': JSON.stringify(env),
  }),
]);

/**
 * @type {Config}
 */
const CommonConfig = {
  input: {},
  output: {},
  inlineDynamicImports: true,
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external,
};

/**
 * @type {Config}
 */
const UMDconfig = {
  ...CommonConfig,
  input: resolve(PATHS.entry.esm5, 'index.js'),
  output: {
    file: getOutputFileName(resolve(PATHS.bundles, 'index.umd.js'), ifProduction()),
    format: 'umd',
    name: LIB_NAME,
    sourcemap: true,
  },
  plugins: removeEmpty(/** @type {Plugin[]} */ ([...plugins, ifProduction(uglify())])),
};

/**
 * @type {Config}
 */
const FESMconfig = {
  ...CommonConfig,
  input: resolve(PATHS.entry.esm2015, 'index.js'),
  output: [
    {
      file: getOutputFileName(resolve(PATHS.bundles, 'index.esm.js'), ifProduction()),
      format: 'es',
      sourcemap: true,
    },
  ],
  plugins: removeEmpty(/** @type {Plugin[]} */ ([...plugins, ifProduction(terser())])),
};

export default [UMDconfig, FESMconfig];
