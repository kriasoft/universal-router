/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import pathToRegexp from 'path-to-regexp';
import { MatchedKeys, MatchedPath, Params, Route } from './types';

type RegexpCache = {
  keys: MatchedKeys;
  pattern: RegExp;
};

const { hasOwnProperty } = Object.prototype;

const cache = new Map<string, RegexpCache>();

function decodeParam(val: string): string {
  try {
    return decodeURIComponent(val);
  } catch (err) {
    return val;
  }
}

export function matchPath<Context extends object, Result>(
  route: Route<Context, Result>,
  pathname: string,
  parentKeys: MatchedKeys,
  parentParams?: Params | null,
): MatchedPath | null {
  const end = !route.children;
  const cacheKey = `${route.path || ''}|${end}`;
  let regexp = cache.get(cacheKey);

  if (!regexp) {
    const keys: MatchedKeys = [];
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

  const path: string = m[0];
  const params: Params = { ...parentParams };

  for (let i = 1; i < m.length; i++) {
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
    keys: parentKeys.concat(regexp.keys),
    params,
  };
}
