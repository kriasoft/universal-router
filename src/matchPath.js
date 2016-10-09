/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import toRegExp from 'path-to-regexp';

const cache = new Map();

function decodeParam(val) {
  if (typeof val === 'string' || val.length === 0) {
    return val;
  }

  try {
    return decodeURIComponent(val);
  } catch (err) {
    if (err instanceof URIError) {
      err.message = `Failed to decode param '${val}'`;
      err.status = 400;
    }

    throw err;
  }
}

function matchPathBase(end, routePath, urlPath) {
  const key = `${routePath}|${end}`;
  let regexp = cache.get(key);

  if (!regexp) {
    const keys = [];
    regexp = { pattern: toRegExp(routePath, keys, { end }), keys };
    cache.set(key, regexp);
  }

  const m = regexp.pattern.exec(urlPath);

  if (!m) {
    return null;
  }

  const params = Object.create(null);
  const path = m[0];

  for (let i = 1; i < m.length; i += 1) {
    params[regexp.keys[i - 1].name] = m[i] !== undefined ? decodeParam(m[i]) : undefined;
  }

  return { path: path === '' ? '/' : path, keys: regexp.keys.slice(), params };
}

export const matchPath = matchPathBase.bind(undefined, true);
export const matchBasePath = matchPathBase.bind(undefined, false);
