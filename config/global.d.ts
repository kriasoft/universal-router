// ============================
// extend existing types
// ============================
declare namespace NodeJS {
  interface ProcessEnv {
    CI: 'true' | 'false';
  }
}

// ============================
// Rollup plugins without types
// ============================
type RollupPluginImpl<O extends object = object> = import('rollup').PluginImpl<O>;

declare module 'rollup-plugin-json' {
  export interface Options {
    /**
     *  All JSON files will be parsed by default, but you can also specifically include/exclude files
     */
    include?: string | string[];
    exclude?: string | string[];
    /**
     *  for tree-shaking, properties will be declared as variables, using either `var` or `const`
     *  @default false
     */
    preferConst?: boolean;
    /**
     * specify indentation for the generated default export — defaults to '\t'
     * @default '\t'
     */
    indent?: string;
  }
  const plugin: RollupPluginImpl<Options>;
  export default plugin;
}
declare module 'rollup-plugin-sourcemaps' {
  const plugin: RollupPluginImpl;
  export default plugin;
}
declare module 'rollup-plugin-node-resolve' {
  const plugin: RollupPluginImpl;
  export default plugin;
}
declare module 'rollup-plugin-commonjs' {
  const plugin: RollupPluginImpl;
  export default plugin;
}
declare module 'rollup-plugin-replace' {
  const plugin: RollupPluginImpl;
  export default plugin;
}
declare module 'rollup-plugin-uglify' {
  const uglify: RollupPluginImpl;
  export { uglify };
}
declare module 'rollup-plugin-terser' {
  const terser: RollupPluginImpl;
  export { terser };
}

// =====================
// missing library types
// =====================

// ts-jest types require 'babel__core'
declare module 'babel__core' {
  interface TransformOptions {}
}

declare module '@commitlint/core' {
  interface Config {
    extends: string[];
  }
}
declare module 'sort-object-keys' {
  const sortPackageJson: <T extends {}>(object: T, sortWith?: (...args: any[]) => any) => T;
  export = sortPackageJson;
}

declare module 'replace-in-file' {
  interface Options {
    files: string | string[];
    from: Array<string | RegExp>;
    to: string | string[];
    ignore: string | string[];
    dry: boolean;
    encoding: string;
    disableGlobs: boolean;
    allowEmptyPaths: boolean;
  }

  interface API {
    (options: Partial<Options>): string[];
    sync(options: Partial<Options>): string[];
  }

  const api: API;
  export = api;
}

declare module 'gzip-size' {
  type Options = import('zlib').ZlibOptions;
  type Input = string | Buffer;

  function gzipSize(input: Input, options?: Options): Promise<number>;
  namespace gzipSize {
    function sync(input: Input, options?: Options): number;
    function stream(options?: Options): import('stream').PassThrough;
    function file(path: string, options?: Options): Promise<number>;
    function fileSync(path: string, options?: Options): number;
  }

  export = gzipSize;
}

declare module 'brotli-size' {
  type Input = string | Buffer;

  namespace brotliSize {
    function sync(input: Input): number;
    function stream(): import('stream').PassThrough;
  }

  function brotliSize(input: Input): Promise<number>;

  export = brotliSize;
}

declare module 'pretty-bytes' {
  type Options = {
    /**
     * @default false
     */
    signed: boolean;
    /**
     * @default false
     */
    locale: string | boolean;
  };

  function prettyBytes(input: number, options?: Partial<Options>): string;

  export = prettyBytes;
}
