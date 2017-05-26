/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import pathToRegexp from 'path-to-regexp';

const cache = Object.create(null);

function decodeParam(val) {
  try {
    return decodeURIComponent(val);
  } catch (err) {
    return val;
  }
}

function matchPath(routePath, urlPath, end, parentParams) {
  const key = `${routePath}|${end}`;
  let regexp = cache[key];

  if (!regexp) {
    const keys = [];
    regexp = { pattern: pathToRegexp(routePath, keys, { end }), keys };
    cache[key] = regexp;
  }

  const m = regexp.pattern.exec(urlPath);
  if (!m) {
    return null;
  }

  const path = m[0];
  const params = Object.create(null);

  if (parentParams) {
    Object.assign(params, parentParams);
  }

  for (let i = 1; i < m.length; i += 1) {
    params[regexp.keys[i - 1].name] = m[i] && decodeParam(m[i]);
  }

  return { path: path === '' ? '/' : path, keys: regexp.keys.slice(), params };
}

export default matchPath;
