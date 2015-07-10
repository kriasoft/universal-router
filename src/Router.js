/**
 * React Routing | http://www.kriasoft.com/react-routing
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import Route from './Route';

const eventTypes = ['error'];

class Router {

  /**
   * Creates a new instance of the `Router` class.
   */
  constructor(initialize) {
    this.routes = [];
    this.events = Object.create(null);

    if (typeof initialize === 'function') {
      initialize(this.on.bind(this));
    }
  }

  /**
   * Adds a new route to the routing table or registers an event listener.
   *
   * @param {String} path A string in the Express format, an array of strings, or a regular expression.
   * @param {Function|Array} handlers Asynchronous route handler function(s).
   */
  on(path, ...handlers) {
    if (eventTypes.some(x => x === path)) {
      this.events[path] = handlers[0];
    } else {
      this.routes.push(new Route(path, handlers));
    }
  }

  async dispatch(path, context, cb) {
    const state = { path, context };
    const routes = this.routes;
    const handlers = (function* () {
      for (const route of routes) {
        const match = route.match(state.path);
        if (match) {
          for (let handler of match.route.handlers) {
            yield [match, handler];
          }
        }
      }
    })();

    let value, done = false;

    async function next() {
      if (({ value, done } = handlers.next()) && !done) {
        const [, handler] = value;
        return handler.length > 1 ?
          await handler(state, next) : await handler(state);
      }
    }

    while (!done) {
      const result = await next();
      if (result) {
        cb(result);
        return;
      }
    }
  }

}

export default Router;
