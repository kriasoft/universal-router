/**
 * Babel Starter Kit | https://github.com/kriasoft/babel-starter-kit
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import del from 'del';
import fs from './utils/fs';

const cleanup = async () => new Promise((resolve) => {
  console.log('Cleanup');
  del(['.tmp/*', 'lib/*'], resolve());
});

const compile = async () => {
  console.log('Compile');
  const babel = require('babel');
  const files = await fs.getFiles('src');

  for (let file of files) {
    let source = await fs.readFile('src/' + file);
    let result = babel.transform(source);
    await fs.writeFile('lib/' + file, result.code);
    await fs.writeFile('lib/' + file.substr(0, file.length - 3) + '.babel.js', source);
  }
};

(async () => {
  try {
    await cleanup();
    await compile();
  } catch (err) {
    console.error(err.message);
  }
})();
