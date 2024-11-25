/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import type { ParseOptions, CompileOptions } from './path-to-regexp.js'
import { parse, compile, stringify, TokenData } from './path-to-regexp.js'
import UniversalRouter, { Route, Routes } from './universal-router.js'

export interface UrlParams {
  [paramName: string]: string | string[]
}

export interface GenerateUrlsOptions extends ParseOptions, CompileOptions {
  /**
   * Add a query string to generated url based on unknown route params.
   */
  stringifyQueryParams?: (params: UrlParams) => string
  /**
   * Generates a unique route name based on all parent routes with the specified separator.
   */
  uniqueRouteNameSep?: string
}

/**
 * Create a url by route name from route path.
 */
type GenerateUrl = (routeName: string, params?: UrlParams) => string

type Keys = { [key: string]: boolean }

function cacheRoutes(
  routesByName: Map<string, Route>,
  route: Route,
  routes: Routes | null | undefined,
  name?: string,
  sep?: string,
): void {
  if (route.name && name && routesByName.has(name)) {
    throw new Error(`Route "${name}" already exists`)
  }

  if (route.name && name) {
    routesByName.set(name, route)
  }

  if (routes) {
    for (let i = 0; i < routes.length; i++) {
      const childRoute = routes[i]!
      const childName = childRoute.name
      childRoute.parent = route
      cacheRoutes(
        routesByName,
        childRoute,
        childRoute.children,
        name && sep ? (childName ? name + sep + childName : name) : childName,
        sep,
      )
    }
  }
}

/**
 * Create a function to generate urls by route names.
 */
function generateUrls(
  router: UniversalRouter,
  options?: GenerateUrlsOptions,
): GenerateUrl {
  if (!router) {
    throw new ReferenceError('Router is not defined')
  }

  const routesByName = new Map<string, Route>()
  const regexpByRoute = new Map<
    Route,
    { toPath: (params?: UrlParams) => string | undefined; keys: Keys }
  >()
  const opts: GenerateUrlsOptions = { encode: encodeURIComponent, ...options }
  return (routeName: string, params?: UrlParams): string => {
    let route = routesByName.get(routeName)
    if (!route) {
      routesByName.clear()
      regexpByRoute.clear()
      cacheRoutes(
        routesByName,
        router.root,
        router.root.children,
        router.root.name,
        opts.uniqueRouteNameSep,
      )

      route = routesByName.get(routeName)
      if (!route) {
        throw new Error(`Route "${routeName}" not found`)
      }
    }

    let regexp = regexpByRoute.get(route)
    if (!regexp) {
      let fullPath = ''
      let rt: Route | null | undefined = route
      while (rt) {
        const path = Array.isArray(rt.path) ? rt.path[0] : rt.path
        if (path) {
          fullPath =
            (path instanceof TokenData ? stringify(path) : path) + fullPath
        }
        rt = rt.parent
      }
      const tokens = parse(fullPath, opts)
      const toPath = compile(fullPath, opts)
      const keys: Keys = Object.create(null)
      for (let i = 0; i < tokens.tokens.length; i++) {
        const token = tokens.tokens[i]
        if (token && token.type !== 'text') {
          if (token.type === 'group') {
            keys[String(i)] = true
          } else {
            keys[token.name] = true
          }
        }
      }
      regexp = { toPath, keys }
      regexpByRoute.set(route, regexp)
    }

    let url = router.baseUrl + regexp.toPath(params) || '/'

    if (opts.stringifyQueryParams && params) {
      const queryParams: UrlParams = {}
      const keys = Object.keys(params)
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        if (key && !regexp.keys[key] && params[key] != null) {
          queryParams[key] = params[key]
        }
      }
      const query = opts.stringifyQueryParams(queryParams)
      if (query) {
        url += query.charAt(0) === '?' ? query : `?${query}`
      }
    }

    return url
  }
}

export default generateUrls
