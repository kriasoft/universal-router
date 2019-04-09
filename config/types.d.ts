// ===== JEST ====
export type TsJestConfig = import('ts-jest/dist/types').TsJestConfig;
export type JestConfig = Partial<jest.ProjectConfig & jest.GlobalConfig>;

// ==== PRETTIER ====
export type PrettierConfig = import('prettier').Options;

// ==== ROLLUP ====
export type RollupConfig = import('rollup').InputOptions & {
  output: import('rollup').OutputOptions | Array<import('rollup').OutputOptions | null>;
};
export type RollupPlugin = import('rollup').Plugin;
