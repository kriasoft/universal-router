/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import UniversalRouter from './UniversalRouter'

const { pathToRegexp } = UniversalRouter
const cache = new Map()

function cacheRoutes(routesByName, route, routes) {
  if (routesByName.has(route.name)) {
    throw new Error(`Route "${route.name}" already exists`)
  }

  if (route.name) {
    routesByName.set(route.name, route)
  }

  if (routes) {
    for (let i = 0; i < routes.length; i++) {
      const childRoute = routes[i]
      childRoute.parent = route
      cacheRoutes(routesByName, childRoute, childRoute.children)
    }
  }
}

function generateUrls(router, options = {}) {
  if (!(router instanceof UniversalRouter)) {
    throw new TypeError('An instance of UniversalRouter is expected')
  }

  router.routesByName = router.routesByName || new Map()

  return (routeName, params) => {
    let route = router.routesByName.get(routeName)
    if (!route) {
      router.routesByName.clear() // clear cache
      cacheRoutes(router.routesByName, router.root, router.root.children)

      route = router.routesByName.get(routeName)
      if (!route) {
        throw new Error(`Route "${routeName}" not found`)
      }
    }

    let regexp = cache.get(route.fullPath)
    if (!regexp) {
      let fullPath = ''
      let rt = route
      while (rt) {
        const path = Array.isArray(rt.path) ? rt.path[0] : rt.path
        if (path) {
          fullPath = path + fullPath
        }
        rt = rt.parent
      }
      const tokens = pathToRegexp.parse(fullPath)
      const toPath = pathToRegexp.tokensToFunction(tokens)
      const keys = Object.create(null)
      for (let i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] !== 'string') {
          keys[tokens[i].name] = true
        }
      }
      regexp = { toPath, keys }
      cache.set(fullPath, regexp)
      route.fullPath = fullPath
    }

    let url = router.baseUrl + regexp.toPath(params, options) || '/'

    if (options.stringifyQueryParams && params) {
      const queryParams = {}
      const keys = Object.keys(params)
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        if (!regexp.keys[key]) {
          queryParams[key] = params[key]
        }
      }
      const query = options.stringifyQueryParams(queryParams)
      if (query) {
        url += query.charAt(0) === '?' ? query : `?${query}`
      }
    }

    return url
  }
}

export default generateUrls
