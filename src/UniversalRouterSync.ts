/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import {
  match,
  Path,
  Match,
  MatchFunction,
  ParseOptions,
  TokensToRegexpOptions,
  RegexpToFunctionOptions,
} from 'path-to-regexp'

/**
 * In addition to a URL path string, any arbitrary data can be passed to
 * the `router.resolve()` method, that becomes available inside action functions.
 */
export interface RouterContext {
  [propName: string]: any
}

export interface ResolveContext extends RouterContext {
  /**
   * URL which was transmitted to `router.resolve()`.
   */
  pathname: string
}

/**
 * Params is a key/value object that represents extracted URL parameters.
 */
export interface RouteParams {
  [paramName: string]: string | string[]
}

export type RouteResultSync<T> = T | null | undefined

export interface RouteContext<R = any, C extends RouterContext = RouterContext>
  extends ResolveContext {
  /**
   * Current router instance.
   */
  router: UniversalRouterSync<R, C>
  /**
   * Matched route object.
   */
  route: Route<R, C>
  /**
   * Base URL path relative to the path of the current route.
   */
  baseUrl: string
  /**
   * Matched path.
   */
  path: string
  /**
   * Matched path params.
   */
  params: RouteParams
  /**
   * Middleware style function which can continue resolving.
   */
  next: (resume?: boolean) => RouteResultSync<R>
}

/**
 * A Route is a singular route in your application. It contains a path, an
 * action function, and optional children which are an array of Route.
 * @template C User context that is made union with RouterContext.
 * @template R Result that every action function resolves to.
 */
export interface Route<R = any, C extends RouterContext = RouterContext> {
  /**
   * A string, array of strings, or a regular expression. Defaults to an empty string.
   */
  path?: Path
  /**
   * A unique string that can be used to generate the route URL.
   */
  name?: string
  /**
   * The link to the parent route is automatically populated by the router. Useful for breadcrumbs.
   */
  parent?: Route<R, C> | null
  /**
   * An array of Route objects. Nested routes are perfect to be used in middleware routes.
   */
  children?: Routes<R, C> | null
  /**
   * Action method should return anything except `null` or `undefined` to be resolved by router
   * otherwise router will throw `Page not found` error if all matched routes returned nothing.
   */
  action?: (context: RouteContext<R, C>, params: RouteParams) => RouteResultSync<R>
  /**
   * The route path match function. Used for internal caching.
   */
  match?: MatchFunction<RouteParams>
}

/**
 * Routes is an array of type Route.
 * @template C User context that is made union with RouterContext.
 * @template R Result that every action function resolves to.
 */
export type Routes<R = any, C extends RouterContext = RouterContext> = Array<Route<R, C>>

export type ResolveRoute<R = any, C extends RouterContext = RouterContext> = (
  context: RouteContext<R, C>,
  params: RouteParams,
) => RouteResultSync<R>

export type RouteError = Error & { status?: number }

export type ErrorHandler<R = any> = (
  error: RouteError,
  context: ResolveContext,
) => RouteResultSync<R>

export interface RouterOptions<R = any, C extends RouterContext = RouterContext>
  extends ParseOptions,
    TokensToRegexpOptions,
    RegexpToFunctionOptions {
  context?: C
  baseUrl?: string
  resolveRoute?: ResolveRoute<R, C>
  errorHandler?: ErrorHandler<R>
}

export interface RouteMatch<R = any, C extends RouterContext = RouterContext> {
  route: Route<R, C>
  baseUrl: string
  path: string
  params: RouteParams
}

function decode(val: string): string {
  try {
    return decodeURIComponent(val)
  } catch (err) {
    return val
  }
}

function matchRoute<R, C extends RouterContext>(
  route: Route<R, C>,
  baseUrl: string,
  options: RouterOptions<R, C>,
  pathname: string,
  parentParams?: RouteParams,
): Iterator<RouteMatch<R, C>, false, Route<R, C> | false> {
  let matchResult: Match<RouteParams>
  let childMatches: Iterator<RouteMatch<R, C>, false, Route<R, C> | false> | null
  let childIndex = 0

  return {
    next(routeToSkip: Route<R, C> | false): IteratorResult<RouteMatch<R, C>, false> {
      if (route === routeToSkip) {
        return { done: true, value: false }
      }

      if (!matchResult) {
        const rt = route
        const end = !rt.children
        if (!rt.match) {
          rt.match = match<RouteParams>(rt.path || '', { end, ...options })
        }
        matchResult = rt.match(pathname)

        if (matchResult) {
          const { path } = matchResult
          matchResult.path = !end && path.charAt(path.length - 1) === '/' ? path.substr(1) : path
          matchResult.params = { ...parentParams, ...matchResult.params }
          return {
            done: false,
            value: {
              route,
              baseUrl,
              path: matchResult.path,
              params: matchResult.params,
            },
          }
        }
      }

      if (matchResult && route.children) {
        while (childIndex < route.children.length) {
          if (!childMatches) {
            const childRoute = route.children[childIndex]!
            childRoute.parent = route

            childMatches = matchRoute<R, C>(
              childRoute,
              baseUrl + matchResult.path,
              options,
              pathname.substr(matchResult.path.length),
              matchResult.params,
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

      return { done: true, value: false }
    },
  }
}

function resolveRoute<R = any, C extends RouterContext = object>(
  context: RouteContext<R, C>,
  params: RouteParams,
): RouteResultSync<R> {
  if (typeof context.route.action === 'function') {
    return context.route.action(context, params)
  }
  return undefined
}

function isChildRoute<R = any, C extends RouterContext = object>(
  parentRoute: Route<R, C> | false,
  childRoute: Route<R, C>,
): boolean {
  let route: Route<R, C> | null | undefined = childRoute
  while (route) {
    route = route.parent
    if (route === parentRoute) {
      return true
    }
  }
  return false
}

class UniversalRouterSync<R = any, C extends RouterContext = RouterContext> {
  root: Route<R, C>

  baseUrl: string

  options: RouterOptions<R, C>

  constructor(routes: Routes<R, C> | Route<R, C>, options?: RouterOptions<R, C>) {
    if (!routes || typeof routes !== 'object') {
      throw new TypeError('Invalid routes')
    }

    this.options = { decode, ...options }
    this.baseUrl = this.options.baseUrl || ''
    this.root = Array.isArray(routes) ? { path: '', children: routes, parent: null } : routes
    this.root.parent = null
  }

  /**
   * Traverses the list of routes in the order they are defined until it finds
   * the first route that matches provided URL path string and whose action function
   * returns anything other than `null` or `undefined`.
   */
  resolve(pathnameOrContext: string | ResolveContext): RouteResultSync<R> {
    const context: ResolveContext = {
      router: this,
      ...this.options.context,
      ...(typeof pathnameOrContext === 'string'
        ? { pathname: pathnameOrContext }
        : pathnameOrContext),
    }
    const matchResult = matchRoute(
      this.root,
      this.baseUrl,
      this.options,
      context.pathname.substr(this.baseUrl.length),
    )
    const resolve = this.options.resolveRoute || resolveRoute
    let matches: IteratorResult<RouteMatch<R, C>, false>
    let nextMatches: IteratorResult<RouteMatch<R, C>, false> | null
    let currentContext = context

    function next(
      resume: boolean,
      parent: Route<R, C> | false = !matches.done && matches.value.route,
      prevResult?: RouteResultSync<R>,
    ): RouteResultSync<R> {
      const routeToSkip = prevResult === null && !matches.done && matches.value.route
      matches = nextMatches || matchResult.next(routeToSkip)
      nextMatches = null

      if (!resume) {
        if (matches.done || !isChildRoute(parent, matches.value.route)) {
          nextMatches = matches
          return null
        }
      }

      if (matches.done) {
        const error: RouteError = new Error('Route not found')
        error.status = 404
        throw error
      }

      currentContext = { ...context, ...matches.value }

      const result = resolve(currentContext as RouteContext<R, C>, matches.value.params)
      if (result !== null && result !== undefined) {
        return result
      }
      return next(resume, parent, result)
    }

    context['next'] = next

    try {
      return next(true, this.root)
    } catch (error) {
      if (this.options.errorHandler) {
        return this.options.errorHandler(error as RouteError, currentContext)
      }
      throw error
    }
  }
}

export default UniversalRouterSync
