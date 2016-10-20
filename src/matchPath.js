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
  if (val === undefined || val === '') {
    return val;
  }

  try {
    return decodeURIComponent(val);
  } catch (err) {
    return val;
  }
}

function matchPathBase(end, routePath, urlPath, parentParams) {
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

  const path = m[0];
  const params = Object.create(null);
  if (parentParams) {
    Object.assign(params, parentParams);
  }

  for (let i = 1; i < m.length; i += 1) {
    params[regexp.keys[i - 1].name] = decodeParam(m[i]);
  }

  return { path: path === '' ? '/' : path, keys: regexp.keys.slice(), params };
}

export const matchPath = matchPathBase.bind(undefined, true);
export const matchBasePath = matchPathBase.bind(undefined, false);
