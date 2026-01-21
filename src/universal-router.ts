/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { match } from './path-to-regexp.js'
import type {
  Path,
  Match,
  MatchFunction,
  ParseOptions,
  MatchOptions,
  PathToRegexpOptions,
  CompileOptions,
} from './path-to-regexp.js'

/**
 * Base context interface for router. Extend this to add custom properties.
 * @example
 * interface AppContext extends RouterContext {
 *   user?: User
 *   db: Database
 * }
 */
export interface RouterContext {
  [propName: string]: any
}

/** Context passed to resolve(), includes pathname and any custom context properties */
export interface ResolveContext extends RouterContext {
  /** URL pathname to match against routes */
  pathname: string
}

/** Route parameters extracted from the URL path (e.g., { id: '123' } from '/users/:id') */
export interface RouteParams {
  [paramName: string]: string | string[]
}

/** Return type for route actions. Return undefined to try children, null to skip this route entirely */
export type RouteResult<T> =
  | T
  | null
  | undefined
  | Promise<T | null | undefined>

/** Utility type that flattens intersection types for better IDE display */
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & NonNullable<unknown>

/** Empty params type for routes without parameters */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type EmptyParams = {}

type IsEmptyObject<T> = keyof T extends never ? true : false

/** Combines extracted params with RouteParams base, applying Prettify for IDE display */
type WithRouteParams<T> =
  IsEmptyObject<T> extends true ? RouteParams : Prettify<T> & RouteParams

type ExtractColonParam<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param]: string } & ExtractParams<`/${Rest}`>
    : Path extends `${string}:${infer Param}`
      ? { [K in Param]: string }
      : null

type ExtractWildcard<Path extends string> =
  Path extends `${string}*${infer Wildcard}/${infer Rest}`
    ? { [K in Wildcard]: string[] } & ExtractParams<`/${Rest}`>
    : Path extends `${string}*${infer Wildcard}`
      ? { [K in Wildcard]: string[] }
      : null

/**
 * Extracts parameter types from a path string.
 * @example
 * ExtractParams<'/users/:id'> // { id: string }
 * ExtractParams<'/files/*path'> // { path: string[] }
 */
export type ExtractParams<Path extends string> =
  ExtractColonParam<Path> extends infer ColonResult
    ? ColonResult extends null
      ? ExtractWildcard<Path> extends infer WildcardResult
        ? WildcardResult extends null
          ? EmptyParams
          : WildcardResult
        : EmptyParams
      : ColonResult
    : EmptyParams

/** Merges path params with parent params, falling back to RouteParams when both are empty */
type TypedParams<
  Path extends string,
  ParentParams extends RouteParams = EmptyParams,
> = WithRouteParams<ExtractParams<Path> & ParentParams>

/**
 * Typed route context with strongly-typed params based on the route path
 * @example
 * // Use with destructuring to get typed params
 * action: ({ params }) => params.userId // params.userId is typed as string
 */
export interface TypedRouteContext<
  Params extends RouteParams = RouteParams,
  R = any,
  C extends RouterContext = RouterContext,
> extends Omit<RouteContext<R, C>, 'params'> {
  /** Parameters extracted from URL, typed based on route path */
  params: Params
}

interface TypedRoute<
  P extends string = string,
  R = unknown,
  C extends RouterContext = RouterContext,
  ParentParams extends RouteParams = EmptyParams,
> extends Omit<Route<R, C>, 'path' | 'action' | 'children'> {
  path: P
  action?: (
    context: TypedRouteContext<TypedParams<P, ParentParams>, R, C>,
    params: TypedParams<P, ParentParams>,
  ) => RouteResult<R>
  children?:
    | TypedRoute<string, R, C, Prettify<ExtractParams<P> & ParentParams>>[]
    | null
}

/**
 * Helper for defining routes with typed action parameters.
 * Use this when you want TypeScript to infer parameter types in route actions.
 *
 * @example
 * // Direct usage - params.userId is typed as string
 * defineRoute({
 *   path: '/users/:userId',
 *   action: (ctx, params) => fetchUser(params.userId)
 * })
 *
 * // Destructured context - ctx.params.userId is also typed
 * defineRoute({
 *   path: '/users/:userId',
 *   action: ({ params }) => fetchUser(params.userId)
 * })
 *
 * // Factory usage for consistent result/context types
 * const route = defineRoute<JSX.Element, AppContext>()
 * route({ path: '/users/:id', action: (ctx, params) => <User id={params.id} /> })
 *
 * // With parent params inheritance
 * defineRoute({
 *   path: '/orgs/:orgId',
 *   children: [
 *     { path: '/users/:userId', action: ({ params }) => params.orgId + params.userId }
 *   ]
 * })
 */
export function defineRoute<
  R = unknown,
  C extends RouterContext = RouterContext,
>(): <const P extends string, PP extends RouteParams = EmptyParams>(
  route: TypedRoute<P, R, C, PP>,
) => TypedRoute<P, R, C, PP>

export function defineRoute<
  const P extends string,
  R = unknown,
  C extends RouterContext = RouterContext,
  PP extends RouteParams = EmptyParams,
>(route: TypedRoute<P, R, C, PP>): TypedRoute<P, R, C, PP>

export function defineRoute<
  const P extends string,
  R = unknown,
  C extends RouterContext = RouterContext,
  PP extends RouteParams = EmptyParams,
>(
  route?: TypedRoute<P, R, C, PP>,
):
  | TypedRoute<P, R, C, PP>
  | (<const P2 extends string, PP2 extends RouteParams = EmptyParams>(
      r: TypedRoute<P2, R, C, PP2>,
    ) => TypedRoute<P2, R, C, PP2>) {
  if (route === undefined) {
    return <const P2 extends string, PP2 extends RouteParams = EmptyParams>(
      r: TypedRoute<P2, R, C, PP2>,
    ) => r
  }
  return route
}

/**
 * Context passed to route actions. Includes router instance, matched route,
 * extracted params, and next() function for delegation.
 */
export interface RouteContext<
  R = any,
  C extends RouterContext = RouterContext,
> extends ResolveContext {
  /** Router instance processing this request */
  router: UniversalRouter<R, C>
  /** Currently matched route */
  route: Route<R, C>
  /** Accumulated base URL from parent routes */
  baseUrl: string
  /** Matched portion of the pathname */
  path: string
  /** Parameters extracted from URL */
  params: RouteParams
  /** Continue to next matching route */
  next: (resume?: boolean) => Promise<R>
}

/** Route definition object */
export interface Route<R = any, C extends RouterContext = RouterContext> {
  /** URL pattern to match (e.g., '/users/:id') */
  path?: Path | Path[]
  /** Route name for URL generation */
  name?: string
  /** Parent route reference (set internally) */
  parent?: Route<R, C> | null
  /** Nested child routes */
  children?: Routes<R, C> | null
  /** Handler function called when route matches */
  action?: (context: RouteContext<R, C>, params: RouteParams) => RouteResult<R>
  /** Compiled match function (set internally) */
  match?: MatchFunction<RouteParams>
}

/** Array of route definitions */
export type Routes<R = any, C extends RouterContext = RouterContext> = Route<
  R,
  C
>[]

/** Custom route resolver function signature */
export type ResolveRoute<R = any, C extends RouterContext = RouterContext> = (
  context: RouteContext<R, C>,
  params: RouteParams,
) => RouteResult<R>

/** Error with optional HTTP status code. Thrown when no route matches (status 404) */
export type RouteError = Error & { status?: number }

/** Error handler function for catching route errors */
export type ErrorHandler<R = any> = (
  error: RouteError,
  context: ResolveContext,
) => RouteResult<R>

/** Router configuration options */
export interface RouterOptions<R = any, C extends RouterContext = RouterContext>
  extends ParseOptions, MatchOptions, PathToRegexpOptions, CompileOptions {
  /** Custom context available in all route actions */
  context?: C
  /** Base URL prefix for all routes */
  baseUrl?: string
  /** Custom route resolver */
  resolveRoute?: ResolveRoute<R, C>
  /** Handler for route errors */
  errorHandler?: ErrorHandler<R>
}

/** Internal match result containing the matched route, path, and extracted params */
export interface RouteMatch<R = any, C extends RouterContext = RouterContext> {
  /** Matched route object */
  route: Route<R, C>
  /** Accumulated base URL */
  baseUrl: string
  /** Matched path segment */
  path: string
  /** Extracted route parameters */
  params: RouteParams
}

function decode(val: string): string {
  try {
    return decodeURIComponent(val)
  } catch {
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
  let childMatches: Iterator<
    RouteMatch<R, C>,
    false,
    Route<R, C> | false
  > | null
  let childIndex = 0

  return {
    next(
      routeToSkip: Route<R, C> | false,
    ): IteratorResult<RouteMatch<R, C>, false> {
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
          matchResult.path =
            !end && path.charAt(path.length - 1) === '/' ? path.substr(1) : path
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
            return { done: false, value: childMatch.value }
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
): RouteResult<R> {
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

/**
 * Isomorphic router for JavaScript web applications.
 *
 * @example
 * const routes = [
 *   { path: '/', action: () => 'Home' },
 *   { path: '/users/:id', action: (ctx, params) => `User ${params.id}` }
 * ] as const
 *
 * const router = new UniversalRouter(routes)
 * const result = await router.resolve('/users/123') // 'User 123'
 *
 * @typeParam R - Route action return type
 * @typeParam C - Custom context type extending RouterContext
 * @typeParam RouteDefs - Route definitions (inferred for type-safe URL generation)
 */
class UniversalRouter<
  R = any,
  C extends RouterContext = RouterContext,
  const RouteDefs extends Routes<R, C> | Route<R, C> | readonly Route<R, C>[] =
    | Routes<R, C>
    | Route<R, C>,
> {
  /** Root route containing all route definitions */
  root: Route<R, C>
  /** Base URL prefix for all routes */
  baseUrl: string
  /** Router configuration options */
  options: RouterOptions<R, C>

  constructor(routes: RouteDefs, options?: RouterOptions<R, C>) {
    if (!routes || typeof routes !== 'object') {
      throw new TypeError('Invalid routes')
    }

    this.options = { decode, ...options }
    this.baseUrl = this.options.baseUrl || ''
    this.root = Array.isArray(routes)
      ? ({ path: '', children: routes, parent: null } as Route<R, C>)
      : (routes as Route<R, C>)
    this.root.parent = null
  }

  /**
   * Traverses the route tree to find the first matching route whose action
   * returns a non-null/undefined value.
   * @param pathnameOrContext - URL pathname or context object with pathname
   * @throws {RouteError} 404 error if no route matches
   */
  resolve(pathnameOrContext: string | ResolveContext): Promise<RouteResult<R>> {
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
      prevResult?: RouteResult<R>,
    ): Promise<RouteResult<R>> {
      const routeToSkip =
        prevResult === null && !matches.done && matches.value.route
      matches = nextMatches || matchResult.next(routeToSkip)
      nextMatches = null

      if (!resume) {
        if (matches.done || !isChildRoute(parent, matches.value.route)) {
          nextMatches = matches
          return Promise.resolve(null)
        }
      }

      if (matches.done) {
        const error: RouteError = new Error('Route not found')
        error.status = 404
        return Promise.reject(error)
      }

      currentContext = { ...context, ...matches.value }

      return Promise.resolve(
        resolve(currentContext as RouteContext<R, C>, matches.value.params),
      ).then((result) => {
        if (result !== null && result !== undefined) {
          return result
        }
        return next(resume, parent, result)
      })
    }

    context['next'] = next

    return Promise.resolve()
      .then(() => next(true, this.root))
      .catch((error: RouteError) => {
        if (this.options.errorHandler) {
          return this.options.errorHandler(error, currentContext)
        }
        throw error
      })
  }
}

export default UniversalRouter
