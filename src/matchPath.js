/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import pathToRegexp from 'path-to-regexp';

const { hasOwnProperty } = Object.prototype;
const cache = new Map();

function decodeParam(val) {
  try {
    return decodeURIComponent(val);
  } catch (err) {
    return val;
  }
}

function matchPath(route, pathname, parentKeys, parentParams) {
  const end = !route.children;
  const cacheKey = `${route.path || ''}|${end}`;
  let regexp = cache.get(cacheKey);

  if (!regexp) {
    const keys = [];
    regexp = {
      keys,
      pattern: pathToRegexp(route.path || '', keys, { end }),
    };
    cache.set(cacheKey, regexp);
  }

  const m = regexp.pattern.exec(pathname);
  if (!m) {
    return null;
  }

  const path = m[0];
  const params = Object.assign({}, parentParams);

  for (let i = 1; i < m.length; i += 1) {
    const key = regexp.keys[i - 1];
    const prop = key.name;
    const value = m[i];
    if (value !== undefined || !hasOwnProperty.call(params, prop)) {
      if (key.repeat) {
        params[prop] = value ? value.split(key.delimiter).map(decodeParam) : [];
      } else {
        params[prop] = value ? decodeParam(value) : value;
      }
    }
  }

  return {
    path: !end && path.charAt(path.length - 1) === '/' ? path.substr(1) : path,
    keys: regexp.keys.concat(parentKeys),
    params,
  };
}

export default matchPath;
