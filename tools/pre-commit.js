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

const lint = require('./lint')
const test = require('./test')

async function preCommit() {
  await lint()
  await test()
}

module.exports = preCommit().catch(process.exit)
