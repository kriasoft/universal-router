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
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
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
