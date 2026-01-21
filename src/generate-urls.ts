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
import UniversalRouter, {
  Route,
  Routes,
  RouterContext,
  Prettify,
  EmptyParams,
  ExtractParams,
} from './universal-router.js'

/** Parameters for URL generation, including path params and query params */
export interface UrlParams {
  [paramName: string]: string | string[]
}

type IsEmptyObject<T> = keyof T extends never ? true : false

/**
 * Extracts all route names from route definitions as a union type.
 * @example
 * const routes = [{ name: 'home' }, { name: 'users' }] as const
 * type Names = ExtractRouteNames<typeof routes> // 'home' | 'users'
 */
export type ExtractRouteNames<
  Routes extends readonly unknown[],
  Prefix extends string = '',
  Sep extends string = '',
> = Routes extends readonly [infer First, ...infer Rest]
  ? First extends { name: infer N extends string }
    ? First extends { children: infer C extends readonly unknown[] }
      ? // Route with name and children
        // When Sep is empty, don't prefix children (they use their own names)
        // When Sep is non-empty, prefix children with parent name + sep
        Sep extends ''
        ?
            | N
            | ExtractRouteNames<C, '', Sep>
            | ExtractRouteNames<Rest, Prefix, Sep>
        :
            | (Prefix extends '' ? N : `${Prefix}${Sep}${N}`)
            | ExtractRouteNames<
                C,
                Prefix extends '' ? N : `${Prefix}${Sep}${N}`,
                Sep
              >
            | ExtractRouteNames<Rest, Prefix, Sep>
      : // Route with name, no children
        Sep extends ''
        ? N | ExtractRouteNames<Rest, Prefix, Sep>
        :
            | (Prefix extends '' ? N : `${Prefix}${Sep}${N}`)
            | ExtractRouteNames<Rest, Prefix, Sep>
    : First extends { children: infer C extends readonly unknown[] }
      ? // Route without name but with children - use parent prefix
          | ExtractRouteNames<C, Prefix, Sep>
          | ExtractRouteNames<Rest, Prefix, Sep>
      : // Route without name or children
        ExtractRouteNames<Rest, Prefix, Sep>
  : never

/** Extracts first path from array or returns path if string */
type FirstPath<P> = P extends readonly [
  infer First extends string,
  ...unknown[],
]
  ? First
  : P extends string
    ? P
    : never

/** Extracts all full paths from route definitions, including nested routes */
export type ExtractRoutePaths<
  Routes extends readonly unknown[],
  ParentPath extends string = '',
> = Routes extends readonly [infer First, ...infer Rest]
  ? First extends { path: infer P }
    ? FirstPath<P> extends infer FP extends string
      ? First extends { children: infer C extends readonly unknown[] }
        ? // Route with children - include own path and recurse
            | `${ParentPath}${FP}`
            | ExtractRoutePaths<C, `${ParentPath}${FP}`>
            | ExtractRoutePaths<Rest, ParentPath>
        : // Route without children
            `${ParentPath}${FP}` | ExtractRoutePaths<Rest, ParentPath>
      : // Path doesn't resolve to string - skip
        ExtractRoutePaths<Rest, ParentPath>
    : // No path property - skip to rest
      ExtractRoutePaths<Rest, ParentPath>
  : never

/** Maps a route name to its full path, accumulating parent paths for nested routes */
export type RouteNameToFullPath<
  Routes extends readonly unknown[],
  Name extends string,
  ParentPath extends string = '',
  ParentNamePrefix extends string = '',
  Sep extends string = '',
> = Routes extends readonly [infer First, ...infer Rest]
  ? First extends { path: infer P }
    ? FirstPath<P> extends infer FP extends string
      ? First extends { name: infer N extends string }
        ? Sep extends ''
          ? // When Sep is empty, names are independent - just match N directly
            N extends Name
            ? `${ParentPath}${FP}`
            : First extends { children: infer C extends readonly unknown[] }
              ? // Check children, passing accumulated path but NOT name prefix
                  | RouteNameToFullPath<C, Name, `${ParentPath}${FP}`, '', Sep>
                  | RouteNameToFullPath<Rest, Name, ParentPath, '', Sep>
              : RouteNameToFullPath<Rest, Name, ParentPath, '', Sep>
          : // When Sep is non-empty, build the full name with prefix
            (
                ParentNamePrefix extends ''
                  ? N
                  : `${ParentNamePrefix}${Sep}${N}`
              ) extends Name
            ? // Found it - return accumulated path + this route's path
              `${ParentPath}${FP}`
            : First extends { children: infer C extends readonly unknown[] }
              ? // Check children with updated path and name prefix
                  | RouteNameToFullPath<
                      C,
                      Name,
                      `${ParentPath}${FP}`,
                      ParentNamePrefix extends ''
                        ? N
                        : `${ParentNamePrefix}${Sep}${N}`,
                      Sep
                    >
                  | RouteNameToFullPath<
                      Rest,
                      Name,
                      ParentPath,
                      ParentNamePrefix,
                      Sep
                    >
              : // No children, check rest
                RouteNameToFullPath<
                  Rest,
                  Name,
                  ParentPath,
                  ParentNamePrefix,
                  Sep
                >
        : First extends { children: infer C extends readonly unknown[] }
          ? // No name but has children - continue with accumulated path, keep same prefix
              | RouteNameToFullPath<
                  C,
                  Name,
                  `${ParentPath}${FP}`,
                  ParentNamePrefix,
                  Sep
                >
              | RouteNameToFullPath<
                  Rest,
                  Name,
                  ParentPath,
                  ParentNamePrefix,
                  Sep
                >
          : // No name, no children - check rest
            RouteNameToFullPath<Rest, Name, ParentPath, ParentNamePrefix, Sep>
      : // Path doesn't resolve to string - skip to rest
        RouteNameToFullPath<Rest, Name, ParentPath, ParentNamePrefix, Sep>
    : // No path property - skip to rest
      RouteNameToFullPath<Rest, Name, ParentPath, ParentNamePrefix, Sep>
  : never

/**
 * Maps a route name to its required parameters based on the full path.
 * @example
 * const routes = [{ name: 'user', path: '/users/:id' }] as const
 * type Params = RouteNameToParams<typeof routes, 'user'> // { id: string }
 */
export type RouteNameToParams<
  Routes extends readonly unknown[],
  Name extends string,
  Sep extends string = '',
> =
  RouteNameToFullPath<Routes, Name, '', '', Sep> extends infer Path
    ? Path extends string
      ? Prettify<ExtractParams<Path>>
      : EmptyParams
    : EmptyParams

/**
 * Type-safe URL generator function signature.
 * Enforces correct route names and required parameters at compile time.
 */
export type TypedGenerateUrl<
  Routes extends readonly unknown[],
  Sep extends string = '',
> = <Name extends ExtractRouteNames<Routes, '', Sep>>(
  routeName: Name,
  ...args: IsEmptyObject<RouteNameToParams<Routes, Name, Sep>> extends true
    ? [params?: Record<string, string | string[]>]
    : [
        params: RouteNameToParams<Routes, Name, Sep> &
          Record<string, string | string[]>,
      ]
) => string

/** Options for generateUrls() with typed separator for hierarchical route names */
export interface TypedGenerateUrlsOptions<Sep extends string = ''> extends Omit<
  GenerateUrlsOptions,
  'uniqueRouteNameSep'
> {
  uniqueRouteNameSep?: Sep
}

/** Options for URL generation */
export interface GenerateUrlsOptions extends ParseOptions, CompileOptions {
  /** Custom function to serialize query parameters */
  stringifyQueryParams?: (params: UrlParams) => string
  /** Separator for hierarchical route names */
  uniqueRouteNameSep?: string
}

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

type InferRoutes<Router> =
  Router extends UniversalRouter<unknown, RouterContext, infer RouteDefs>
    ? RouteDefs extends readonly unknown[]
      ? RouteDefs
      : never
    : never

type HasTypedRoutes<Routes extends readonly unknown[], Sep extends string> = [
  ExtractRouteNames<Routes, '', Sep>,
] extends [never]
  ? false
  : true

type GenerateUrlsReturnType<Router, Sep extends string> =
  InferRoutes<Router> extends readonly unknown[]
    ? HasTypedRoutes<InferRoutes<Router>, Sep> extends true
      ? TypedGenerateUrl<InferRoutes<Router>, Sep>
      : GenerateUrl
    : GenerateUrl

/**
 * Creates a URL generator function from a router instance.
 * Types are automatically inferred from the router's route definitions.
 *
 * @example
 * const routes = [
 *   { name: 'home', path: '/' },
 *   { name: 'user', path: '/users/:id' }
 * ] as const
 *
 * const router = new UniversalRouter(routes)
 * const url = generateUrls(router)
 *
 * url('home')              // '/'
 * url('user', { id: '1' }) // '/users/1'
 *
 * @param router - Router instance to generate URLs from
 * @param options - URL generation options
 * @returns Type-safe URL generator function
 */
function generateUrls<
  Router extends UniversalRouter<
    unknown,
    RouterContext,
    | Routes<unknown, RouterContext>
    | Route<unknown, RouterContext>
    | readonly Route<unknown, RouterContext>[]
  >,
  Sep extends string = '',
>(
  router: Router,
  options?: TypedGenerateUrlsOptions<Sep>,
): GenerateUrlsReturnType<Router, Sep>

function generateUrls(
  router: UniversalRouter<unknown, RouterContext>,
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
