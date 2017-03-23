/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-present Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import matchPath from './matchPath';

function matchRoute(route, baseUrl, path, parentParams) {
  let match;
  let childMatches;
  let childIndex = 0;

  return {
    next() {
      if (!match) {
        match = matchPath(route.path, path, !route.children, parentParams);

        if (match) {
          return {
            done: false,
            value: {
              route,
              baseUrl,
              path: match.path,
              keys: match.keys,
              params: match.params,
            },
          };
        }
      }

      if (match && route.children) {
        while (childIndex < route.children.length) {
          if (!childMatches) {
            const newPath = path.substr(match.path.length);
            const childRoute = route.children[childIndex];
            childRoute.parent = route;

            childMatches = matchRoute(
              childRoute,
              baseUrl + (match.path === '/' ? '' : match.path),
              newPath.charAt(0) === '/' ? newPath : `/${newPath}`,
              match.params,
            );
          }

          const childMatch = childMatches.next();
          if (!childMatch.done) {
            return {
              done: false,
              value: childMatch.value,
            };
          }

          childMatches = null;
          childIndex += 1;
        }
      }

      return { done: true, value: null };
    },
  };
}

export default matchRoute;
