/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

process.on('unhandledRejection', (error) => {
  throw error
})

const cp = require('child_process')

function spawn(command, args) {
  return new Promise((resolve, reject) => {
    cp.spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] }).on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Exit with code ${code} from "${command} ${args.join(' ')}"`))
      }
    })
  })
}

async function precommit() {
  await spawn('npm', ['run', '--silent', 'lint'])
  await spawn('npm', ['run', '--silent', 'test'])
}

module.exports = precommit()
