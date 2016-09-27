/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import matchRoute from './matchRoute';

async function resolve(routes, pathOrContext) {
  const context = typeof pathOrContext === 'string' || pathOrContext instanceof String
    ? { path: pathOrContext }
    : pathOrContext;
  const root = Array.isArray(routes) ? { path: '/', children: routes } : routes;
  let result;
  let value;
  let done = false;

  const errorRoute = root.children && root.children.find(x => x.path === '/error');
  const match = matchRoute(root, '', context.path);

  async function next() {
    ({ value, done } = match.next());

    if (value && !done) {
      const newContext = Object.assign({}, context, value);

      if (value.route.action) {
        if (errorRoute) {
          try {
            return await value.route.action(newContext, newContext.params);
          } catch (err) {
            err.status = err.status || 500;
            newContext.error = err;
            return await errorRoute.action(newContext, newContext.params);
          }
        } else {
          return await value.route.action(newContext, newContext.params);
        }
      }
    }

    return undefined;
  }

  context.next = next;
  context.end = data => { result = data; done = true; };

  while (!done) {
    result = await next();

    if (result !== undefined) {
      break;
    }
  }

  if (result === undefined && errorRoute) {
    context.error = new Error(`Page ${context.path} Not found`);
    context.error.status = 404;
    return await errorRoute.action(context, {});
  }

  return result;
}

export default resolve;
