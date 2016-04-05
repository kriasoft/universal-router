/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import matchRoute from './matchRoute';

async function match(routes, pathOrContext) {
  const context = typeof pathOrContext === 'string' || pathOrContext instanceof String
    ? { path: pathOrContext }
    : pathOrContext;
  let result;
  let value;
  let done = false;

  const matches = matchRoute(
    Array.isArray(routes) ? { path: '/', children: routes } : routes, '',
    context.path
  );

  async function next() {
    const nextMatch = { value, done } = matches.next();

    if (nextMatch && !done) {
      const newContext = Object.assign({}, context, value);

      if (value.route.action) {
        return await value.route.action(newContext, newContext.params);
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

  return result;
}

export default match;
