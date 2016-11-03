/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import matchRoute from './matchRoute';

function handleRoute(context, params) {
  if (typeof context.route.action === 'function') {
    return context.route.action(context, params);
  }
  return null;
}

async function resolve(routes, pathOrContext, action = handleRoute) {
  const context = typeof pathOrContext === 'string' || pathOrContext instanceof String
    ? { path: pathOrContext }
    : pathOrContext;
  const root = Array.isArray(routes) ? { path: '/', children: routes } : routes;
  let result = null;
  let value;
  let done = false;

  const match = matchRoute(root, '', context.path);

  async function next() {
    ({ value, done } = match.next());

    if (!value || done || (result !== null && result !== undefined)) {
      return result;
    }

    const newContext = Object.assign({}, context, value);
    result = await action(newContext, newContext.params);

    return await next();
  }

  context.next = next;

  await next();

  if (result === null || result === undefined) {
    const error = new Error('Page not found');
    error.status = error.statusCode = 404;
    throw error;
  }

  return result;
}

export default resolve;
