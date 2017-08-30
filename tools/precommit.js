/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

const cp = require('child_process');

function spawn(command, args) {
  return new Promise((resolve, reject) => {
    cp.spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] }).on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Exit with code ${code} from "${command} ${args.join(' ')}"`));
      }
    });
  });
}

async function run() {
  await spawn('npm', ['run', '-s', 'lint']);
  await spawn('npm', ['run', '-s', 'build']);
  await spawn('npm', ['run', '-s', 'test']);
  await spawn('git', ['add', 'dist/universal-router*']);
}

module.exports = run();
