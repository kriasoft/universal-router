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
  let result = null;
  let value;
  let done = false;

  const errorRoute = root.children && root.children.find(x => x.path === '/error');
  const match = matchRoute(root, '', context.path);

  async function next() {
    ({ value, done } = match.next());

    if (!value || done || (result !== null && result !== undefined)) {
      return result;
    }

    if (value.route.action) {
      const newContext = Object.assign({}, context, value);

      if (errorRoute) {
        try {
          result = await value.route.action(newContext, newContext.params);
        } catch (err) {
          err.status = err.status || 500;
          newContext.error = err;
          result = await errorRoute.action(newContext, newContext.params);
        }
      } else {
        result = await value.route.action(newContext, newContext.params);
      }
    }

    return await next();
  }

  context.next = next;
  context.end = (data) => { result = data; done = true; return data; };

  return await next();
}

export default resolve;
