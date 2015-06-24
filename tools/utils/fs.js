/**
 * Babel Starter Kit | https://github.com/kriasoft/babel-starter-kit
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import fs from 'fs';

const exists = path => new Promise(resolve => {
  fs.exists(path, resolve);
});

const getFiles = path => new Promise((resolve, reject) => {
  fs.readdir(path, (err, files) => {
    if (err) {
      reject(err);
    } else {
      resolve(files);
    }
  });
});

const readFile = filename => new Promise((resolve, reject) => {
  fs.readFile(filename, 'utf8', (err, contents) => {
    if (err) {
      reject(err);
    } else {
      resolve(contents);
    }
  });
});

const writeFile = (filename, contents) => new Promise((resolve, reject) => {
  fs.writeFile(filename, contents, 'utf8', (err) => {
    if (err) {
      reject(err);
    } else {
      resolve();
    }
  });
});

export default { exists, getFiles, readFile, writeFile };
