/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { matchPath, matchBasePath } from './matchPath';

function startsWith(targetString, searchString, position = 0) {
  return targetString.substr(position, searchString.length) === searchString;
}

function* matchRoute(route, baseUrl, path, parentParams) {
  let match;

  if (!route.children) {
    match = matchPath(route.path, path, parentParams);

    if (match) {
      yield {
        route,
        baseUrl,
        path: match.path,
        keys: match.keys,
        params: match.params,
      };
    }
  }

  if (route.children) {
    match = matchBasePath(route.path, path, parentParams);

    if (match) {
      yield {
        route,
        baseUrl,
        path: match.path,
        keys: match.keys,
        params: match.params,
      };

      for (let i = 0; i < route.children.length; i += 1) {
        const newPath = path.substr(match.path.length);
        yield* matchRoute(
          route.children[i],
          baseUrl + (match.path === '/' ? '' : match.path),
          startsWith(newPath, '/') ? newPath : `/${newPath}`,
          match.params
        );
      }
    }
  }
}

export default matchRoute;
