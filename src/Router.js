/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Route from './Route';

function* getMatches(context, routes) {
  for (const route of routes) {
    const match = route.match(context.path);
    if (match) {
      for (const action of match.route.actions) {
        yield [match, action];
      }
    }
  }
}

class Router {

  /**
   * Initializes a new instance of the Router class.
   */
  constructor(routes) {
    this.routes = [];
    this.route = this.route.bind(this);

    if (Array.isArray(routes)) {
      routes.forEach(x => {
        this.route(x.path, ...(Array.isArray(x.action) ? x.action : [x.action]));
      });
    } else if (typeof routes === 'function') {
      routes(this.route);
    }
  }

  /**
   * Adds a route to the internal collection.
   */
  route(path, ...actions) {
    this.routes.push(new Route(path, actions));
    return this;
  }

  async dispatch(context) {
    if (typeof context === 'string' || context instanceof String) {
      context = { path: context }; // eslint-disable-line no-param-reassign
    }

    let value; // eslint-disable-line prefer-const
    let result;
    let done = false;

    const matches = getMatches(context, this.routes);

    async function next() {
      const nextMatch = { value, done } = matches.next();
      if (nextMatch && !done) {
        const [match, action] = value;
        context.params = match.params; // eslint-disable-line no-param-reassign
        return action.length > 1 ?
          await action(context, context.params) : await action(context);
      }
      return undefined;
    }

    context.next = next;  // eslint-disable-line no-param-reassign
    context.end = data => { result = data; done = true; };  // eslint-disable-line no-param-reassign

    while (!done) {
      result = await next();
      if (result) {
        /* eslint-disable no-param-reassign */
        context.statusCode = typeof context.statusCode === 'number' ? context.statusCode : 200;
        /* eslint-enable no-param-reassign */
        break;
      }
    }

    return result;
  }

}

export default Router;
