/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { matchPath } from './match-path';
import { MatchedKeys, MatchedPath, MatchedRoute, Params, Route } from './types';

export function matchRoute<Context extends object, Result>(
  route: Route<Context, Result>,
  baseUrl: string,
  pathname: string,
  parentKeys: MatchedKeys,
  parentParams?: Params | null,
) {
  let match: MatchedPath | null = null;
  let childMatches: null | {
    next(routeToSkip?: Route<Context, Result> | null): MatchedRoute<Context, Result>;
  };
  let childIndex = 0;

  return {
    next(routeToSkip?: Route<Context, Result> | null): MatchedRoute<Context, Result> {
      if (route === routeToSkip) {
        return { done: true, value: undefined };
      }

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

          const childMatch = childMatches.next(routeToSkip);
          if (!childMatch.done) {
            return {
              done: false,
              value: childMatch.value,
            };
          }

          childMatches = null;
          childIndex++;
        }
      }

      return { done: true, value: undefined };
    },
  };
}
