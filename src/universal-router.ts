/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import pathToRegexp from 'path-to-regexp';
import { isChildRoute } from './is-child-route';
import { matchRoute } from './match-route';
import { resolveRoute } from './resolve-route';
import {
  ErrorHandler,
  MatchedRoute,
  Options,
  ResolveContext,
  ResolveRoute,
  ResultReturn,
  Route,
  RouteContext,
  RouteNameMap,
  RouteOrRoutes,
} from './types';

type RouterContext<Context extends object, Result> = Context & {
  router: UniversalRouter<Context, Result>;
};

export default class UniversalRouter<Context extends object, Result> {
  static pathToRegexp = pathToRegexp;

  routesByName?: RouteNameMap;

  baseUrl: string;
  errorHandler?: ErrorHandler<Context, Result>;
  resolveRoute: ResolveRoute<Context, Result>;
  context: RouterContext<Context, Result>;
  root: Route<Context, Result>;

  constructor(
    routes: RouteOrRoutes<Context, Result>,
    options: Options<Context, Result> = { context: {} as Context },
  ) {
    if (!routes || typeof routes !== 'object') {
      throw new TypeError('Invalid routes');
    }

    this.baseUrl = options.baseUrl || '';
    this.errorHandler = options.errorHandler;
    this.resolveRoute = options.resolveRoute || resolveRoute;
    this.context = { router: this, ...options.context } as RouterContext<Context, Result>;
    this.root = Array.isArray(routes) ? { path: '', children: routes, parent: null } : routes;
    this.root.parent = null;
  }

  resolve(pathnameOrContext: string | (ResolveContext & Context)): ResultReturn<Result> {
    const context = {
      ...this.context,
      ...(typeof pathnameOrContext === 'string'
        ? { pathname: pathnameOrContext }
        : pathnameOrContext),
    } as RouteContext<Context, Result>;
    const match = matchRoute(
      this.root,
      this.baseUrl,
      context.pathname.substr(this.baseUrl.length),
      [],
      null,
    );
    const resolve = this.resolveRoute;
    let matches: MatchedRoute<Context, Result> | null = null;
    let nextMatches: MatchedRoute<Context, Result> | null = null;
    let currentContext = context;

    function next(
      resume?: boolean,
      parent: Route<Context, Result> | null = matches && matches.value ? matches.value.route : null,
      prevResult?: Result | null | undefined,
    ): ResultReturn<Result> {
      const lastRoute = matches && matches.value ? matches.value.route : null;
      const routeToSkip = prevResult === null ? lastRoute : null;
      matches = nextMatches || match.next(routeToSkip);
      nextMatches = null;

      if (!resume) {
        if (matches.done || !isChildRoute(parent, matches.value.route)) {
          nextMatches = matches;

          return Promise.resolve(null);
        }
      }

      if (matches.done) {
        const error = new Error('Route not found');
        (error as any).status = 404;

        return Promise.reject(error);
      }

      const resolveContext = { ...context, ...matches.value };
      currentContext = resolveContext;

      return Promise.resolve(resolve(resolveContext, matches.value.params)).then((result) => {
        if (result !== null && result !== undefined) {
          return result;
        }

        return next(resume, parent, result);
      });
    }

    context.next = next;

    return Promise.resolve()
      .then(() => next(true, this.root))
      .catch((error) => {
        if (this.errorHandler) {
          return this.errorHandler(error, currentContext);
        }
        throw error;
      });
  }
}
