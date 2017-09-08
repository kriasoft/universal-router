/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import pathToRegexp from 'path-to-regexp';

const cache = new Map();

function decodeParam(val) {
  try {
    return decodeURIComponent(val);
  } catch (err) {
    return val;
  }
}

function matchPath(route, path, parentKeys, parentParams) {
  const key = `${route.path || ''}|${!route.children}`;
  let regexp = cache.get(key);

  if (!regexp) {
    const keys = [];
    regexp = {
      keys,
      pattern: pathToRegexp(route.path || '', keys, { end: !route.children }),
    };
    cache.set(key, regexp);
  }

  const m = regexp.pattern.exec(path || '/');
  if (!m) {
    return null;
  }

  const params = Object.assign({}, parentParams);

  for (let i = 1; i < m.length; i += 1) {
    params[regexp.keys[i - 1].name] = m[i] && decodeParam(m[i]);
  }

  return {
    path: m[0] === '' ? '/' : m[0],
    keys: regexp.keys.concat(parentKeys),
    params,
  };
}

export default matchPath;
