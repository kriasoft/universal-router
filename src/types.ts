import UniversalRouter from './universal-router';

export interface Params {
  [paramName: string]: string | string[];
  [paramIndex: number]: string | string[];
}

export type MatchedKeys = Array<import('path-to-regexp').Key>;

export type MatchedPath = {
  path: string;
  keys: MatchedKeys;
  params: Params;
};

export interface MatchedRouteValue<Context extends object, Result> {
  route: Route<Context, Result>;
  baseUrl: string;
  path: string;
  keys: MatchedKeys;
  params: Params;
}

export type MatchedRoute<Context extends object, Result> =
  | {
      done: true;
      value: undefined;
    }
  | {
      done: false;
      value: MatchedRouteValue<Context, Result>;
    };

export interface ResolveContext {
  pathname: string;
}

export type MayBePromiseLike<T> = T | PromiseLike<T>;

export type ResultReturn<Result> = MayBePromiseLike<Result | null | undefined>;

export interface RouteContext<Context extends object, Result>
  extends ResolveContext,
    MatchedRouteValue<Context, Result> {
  router: UniversalRouter<Context, Result>;
  next(
    resume?: boolean,
    parent?: Route<Context, Result> | null | undefined,
    prevResult?: Result,
  ): ResultReturn<Result>;
}

export interface Route<Context extends object, Result> {
  path?: string | RegExp | Array<string | RegExp>;
  name?: string;
  parent?: Route<Context, Result> | null;
  children?: Routes<Context, Result> | null;
  action?: (context: RouteContext<Context, Result>, params: Params) => ResultReturn<Result>;
  [name: string]: unknown;
}

export type Routes<Context extends object, Result> = Array<Route<Context, Result>>;

export type RouteOrRoutes<Context extends object, Result> =
  | Routes<Context, Result>
  | Route<Context, Result>;

export type ResolveRoute<Context extends object, Result> = (
  context: RouteContext<Context, Result>,
  params: Params,
) => ResultReturn<Result>;

export type ErrorHandler<Context extends object, Result> = (
  error: Error & { status?: number },
  context: RouteContext<Context, Result>,
) => ResultReturn<Result>;

export interface Options<Context extends object, Result> {
  context?: Context;
  baseUrl?: string;
  resolveRoute?: ResolveRoute<Context, Result>;
  errorHandler?: ErrorHandler<Context, Result>;
}

export type RouteNameMap = Map<string, any>;
