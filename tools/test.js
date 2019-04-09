/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

const jest = require('jest');
const cp = require('child_process');

const jestConfig = {
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testMatch: ['**/*.test.js'],
};

function spawn(command, args) {
  return new Promise((resolve, reject) => {
    cp.spawn(command, args, { stdio: 'inherit' }).on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(code);
      }
    });
  });
}

async function test() {
  await spawn('tsc', ['--project', '.']);
  await jest.run(['--config', JSON.stringify(jestConfig), ...process.argv.slice(2)]);
}

module.exports = module.parent ? test : test().catch(process.exit);
