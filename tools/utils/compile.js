/**
 * Babel Starter Kit | https://github.com/kriasoft/babel-starter-kit
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import fm from 'front-matter';
import template from 'lodash.template';
import marked from 'marked';
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

const md = async (source, data) => {
  const layout = template(await fs.readFile('./docs/index.html'));
  const content = fm(source);
  Object.assign(content.attributes, data);
  const body = marked(content.body);
  return layout(Object.assign(content.attributes, { body }));
};

const css = (source, options) => new Promise((resolve, reject) => {
  try {
    postcss.process(source, {
      from: 'docs/css/main.css',
      to: 'docs/css/main.min.css',
      map: !!options.map
    }).then(result => resolve(result.css)).catch(err => reject(err));
  } catch (err) {
    resolve(err);
  }
});

export default { md, css };
