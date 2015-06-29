/**
 * Babel Starter Kit | https://github.com/kriasoft/babel-starter-kit
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import browserify from 'browserify';
import fm from 'front-matter';
import template from 'lodash.template';
import marked from 'marked';
import hljs from 'highlight.js';
import fs from './fs';

const postcss = require('postcss')([
  require('postcss-nested')(),
  require('cssnext')(),
  require('autoprefixer-core')([
    'Android 2.3',
    'Android >= 4',
    'Chrome >= 20',
    'Firefox >= 24',
    'Explorer >= 8',
    'iOS >= 6',
    'Opera >= 12',
    'Safari >= 6'
  ]),
  require('cssnano')()
]);

marked.setOptions({ highlight: code => hljs.highlightAuto(code).value });

const md = async (source, data) => {
  const layout = template(await fs.readFile('./docs/index.html'));
  const content = fm(source);
  Object.assign(content.attributes, data);
  const body = marked(content.body);
  return layout(Object.assign(content.attributes, { body }));
};

const css = (source, options) => new Promise((resolve, reject) => {
  options = options || {};
  try {
    postcss.process(source, {
      from: 'docs/css/main.css',
      to: 'docs/css/main.min.css',
      map: !!options.map
    }).then(result => resolve(result.css)).catch(err => reject(err));
  } catch (err) {
    reject(err);
  }
});

const js = async (options) => new Promise((resolve, reject) => {
  options = options || {};
  browserify('docs/js/main.js', {
    debug: !!options.debug,
    transform: [require('babelify')]
  }).bundle((err, buffer) => {
    if (err) {
      reject(err);
    } else {
      resolve(buffer.toString('utf8'))
    }
  });
});

export default { md, css, js };
