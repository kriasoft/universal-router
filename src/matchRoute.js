/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import matchPath from './matchPath'

function matchRoute(route, baseUrl, pathname, parentKeys, parentParams) {
  let match
  let childMatches
  let childIndex = 0

  return {
    next(routeToSkip) {
      if (route === routeToSkip) {
        return { done: true }
      }

      if (!match) {
        match = matchPath(route, pathname, parentKeys, parentParams)

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
          }
        }
      }

      if (match && route.children) {
        while (childIndex < route.children.length) {
          if (!childMatches) {
            const childRoute = route.children[childIndex]
            childRoute.parent = route

            childMatches = matchRoute(
              childRoute,
              baseUrl + match.path,
              pathname.substr(match.path.length),
              match.keys,
              match.params,
            )
          }

          const childMatch = childMatches.next(routeToSkip)
          if (!childMatch.done) {
            return {
              done: false,
              value: childMatch.value,
            }
          }

          childMatches = null
          childIndex++
        }
      }

      return { done: true }
    },
  }
}

export default matchRoute
