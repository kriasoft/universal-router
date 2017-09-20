/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import matchPath from './matchPath';

function matchRoute(route, baseUrl, pathname, parentKeys, parentParams) {
  let match;
  let childMatches;
  let childIndex = 0;

  return {
    next() {
      if (!match) {
        match = matchPath(route, pathname, parentKeys, parentParams);

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
            const childRoute = route.children[childIndex];
            childRoute.parent = route;

            childMatches = matchRoute(
              childRoute,
              baseUrl + match.path,
              pathname.substr(match.path.length),
              match.keys,
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

      return { done: true };
    },
  };
}

export default matchRoute;
