/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import pathToRegexp = require('path-to-regexp')

export interface Params {
  [paramName: string]: any
}

export interface Context {
  [propName: string]: any
}

export interface ResolveContext extends Context {
  pathname: string
}

export interface RouteContext<C extends Context, R = any> extends ResolveContext {
  router: UniversalRouter<C, R>
  route: Route
  baseUrl: string
  path: string
  params: Params
  keys: pathToRegexp.Key[]
  next: (resume?: boolean) => R
}

export interface Route<C extends Context = any, R = any> {
  path?: string | RegExp | Array<string | RegExp>
  name?: string
  parent?: Route | null
  children?: Routes<C, R> | null
  action?: (context: RouteContext<C, R> & C, params: Params) => R | void
}

export type Routes<C extends Context = Context, R = any> = Array<Route<C, R>>

export interface Options<C extends Context = Context, R = any> {
  context?: C
  baseUrl?: string
  resolveRoute?: (context: C & RouteContext<C, R>, params: Params) => any
  errorHandler?: (error: Error & { status?: number }, context: C & RouteContext<C, R>) => any
}

export default class UniversalRouter<C extends Context = Context, R = any> {
  static pathToRegexp: typeof pathToRegexp
  constructor(routes: Route<C, R> | Routes<C, R>, options?: Options<C>)
  resolve(pathnameOrContext: string | ResolveContext): R
}
