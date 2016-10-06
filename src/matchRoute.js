/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { matchPath, matchBasePath } from './matchPath';

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

      for (const childRoute of route.children) {
        const newPath = path.substr(match.path.length);
        yield* matchRoute(
          childRoute,
          baseUrl + (match.path === '/' ? '' : match.path),
          newPath.startsWith('/') ? newPath : `/${newPath}`,
          match.params
        );
      }
    }
  }
}

export default matchRoute;
