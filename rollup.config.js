import { resolve } from 'path';
import autoExternal from 'rollup-plugin-auto-external';
import sourceMaps from 'rollup-plugin-sourcemaps';
import nodeResolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import { uglify } from 'rollup-plugin-uglify';
import { terser } from 'rollup-plugin-terser';
import { getIfUtils, removeEmpty } from 'webpack-config-utils';

const { getOutputFileName } = require('./config/helpers');

/**
 * @typedef {import('./config/types').RollupConfig} Config
 */
/**
 * @typedef {import('./config/types').RollupPlugin} Plugin
 */

const env = process.env.NODE_ENV || 'development';
const { ifProduction } = getIfUtils(env);

const LIB_NAME = 'UniversalRouter';
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
  bundles: DIST,
};

/**
 * @type {string[]}
 */
// const external = Object.keys(pkg.peerDependencies) || [];

const autoExternalPlugin = autoExternal({
  dependencies: true,
  peerDependencies: false,
});

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

const globalNames = {
  'path-to-regexp': 'pathToRegexp',
};

/**
 * @type {Config}
 */
const CommonConfig = {
  input: {},
  output: {},
  inlineDynamicImports: true,
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  // external,
};

/**
 * @returns {Config}
 */
const UMDconfig = ({ input, out }) => ({
  ...CommonConfig,
  input,
  output: {
    file: getOutputFileName(out + '.umd.js', ifProduction()),
    format: 'umd',
    name: LIB_NAME,
    globals: globalNames,
    sourcemap: true,
  },

  plugins: removeEmpty(/** @type {Plugin[]} */ ([...plugins, ifProduction(uglify())])),
});

/**
 * @returns {Config}
 */
const FESMconfig = ({ input, out }) => ({
  ...CommonConfig,
  input,
  output: [
    {
      file: getOutputFileName(out + '.esm.js', ifProduction()),
      format: 'es',
      sourcemap: true,
    },
    {
      file: getOutputFileName(out + '.js', ifProduction()),
      format: 'cjs',
      sourcemap: true,
    },
  ],
  plugins: removeEmpty(
    /** @type {Plugin[]} */ ([autoExternalPlugin, ...plugins, ifProduction(terser())])
  ),
});

export default [
  UMDconfig({
    input: resolve(PATHS.entry.esm5, 'index.js'),
    out: resolve(PATHS.bundles, 'index'),
  }),
  UMDconfig({
    input: resolve(PATHS.entry.esm5, 'universal-router.js'),
    out: resolve(PATHS.bundles, 'universal-router'),
  }),
  UMDconfig({
    input: resolve(PATHS.entry.esm5, 'universal-router-sync.js'),
    out: resolve(PATHS.bundles, 'universal-router-sync'),
  }),
  UMDconfig({
    input: resolve(PATHS.entry.esm5, 'universal-router-generate-urls.js'),
    out: resolve(PATHS.bundles, 'universal-router-generate-urls'),
  }),

  FESMconfig({
    input: resolve(PATHS.entry.esm2015, 'index.js'),
    out: resolve(PATHS.bundles, 'index'),
  }),
  FESMconfig({
    input: resolve(PATHS.entry.esm2015, 'universal-router.js'),
    out: resolve(PATHS.bundles, 'universal-router'),
  }),
  FESMconfig({
    input: resolve(PATHS.entry.esm2015, 'universal-router-sync.js'),
    out: resolve(PATHS.bundles, 'universal-router-sync'),
  }),
  FESMconfig({
    input: resolve(PATHS.entry.esm2015, 'universal-router-generate-urls.js'),
    out: resolve(PATHS.bundles, 'universal-router-generate-urls'),
  }),
];
