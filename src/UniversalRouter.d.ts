/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import pathToRegexp = require('path-to-regexp')

export interface QueryParams {
  [paramName: string]: string | string[]
}

export interface Context {
  [propName: string]: any
}

export interface ResolveContext extends Context {
  pathname: string
}

export interface RouteContext<C extends Context, R = any> extends ResolveContext {
  router: UniversalRouter<C, R>
  route: Route<C, R>
  baseUrl: string
  path: string
  params: QueryParams
  keys: pathToRegexp.Key[]
  next: (resume?: boolean) => Promise<R>
}

export type Result<T> = T | Promise<T | void> | void

export interface Route<C extends Context = any, R = any> {
  path?: string | RegExp | Array<string | RegExp>
  name?: string
  parent?: Route<C, R> | null
  children?: Routes<C, R> | null
  action?: (context: RouteContext<C, R> & C, params: QueryParams) => Result<R>
}

export type Routes<C extends Context = Context, R = any> = Array<Route<C, R>>

export type ResolveRoute<C extends Context = Context, R = any> = (
  context: C & RouteContext<C, R>,
  params: QueryParams,
) => Result<R>

export type ErrorHandler<C extends Context = Context, R = any> = (
  error: Error & { status?: number },
  context: C & RouteContext<C, R>,
) => Result<R>

export interface Options<C extends Context = Context, R = any> {
  context?: C
  baseUrl?: string
  resolveRoute?: ResolveRoute<C, R>
  errorHandler?: ErrorHandler<C, R>
}

export default class UniversalRouter<C extends Context = Context, R = any> {
  static pathToRegexp: typeof pathToRegexp
  baseUrl: string
  errorHandler?: ErrorHandler<C, R>
  resolveRoute: ResolveRoute<C, R>
  context: C & { router: UniversalRouter<C, R> }
  root: Route<C, R>
  routesByName?: Map<string, Route<C, R>>
  constructor(routes: Route<C, R> | Routes<C, R>, options?: Options<C, R>)
  resolve(pathnameOrContext: string | ResolveContext): Promise<R>
}
