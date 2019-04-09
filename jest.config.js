/**
 * @type {Partial<jest.InitialOptions>}
 */
const config = {
  preset: 'ts-jest',
  rootDir: '.',
  testMatch: [
    '<rootDir>/__tests__/**/*.[tj]s?(x)',
    '<rootDir>/src/**/__tests__/**/*.[tj]s?(x)',
    '<rootDir>/src/**/?(*.)+(spec|test).[tj]s?(x)',
  ],
  modulePathIgnorePatterns: ['dist'],
  testPathIgnorePatterns: ['dist'],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
  setupFiles: ['<rootDir>/config/setup-tests.js'],
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/src/__tests__/tsconfig.json',
    },
  },
};

module.exports = config;
