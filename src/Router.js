/**
 * React Routing | http://www.kriasoft.com/react-routing
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import Route from './Route';
import shortid from 'shortid';

const emptyFunction = function() {};

class Router {

  /**
   * Creates a new instance of the `Router` class.
   */
  constructor(initialize) {
    this.names = [];
    this.routes = [];
    this.events = Object.create(null);

    if (typeof initialize === 'function') {
      initialize(this.on.bind(this));
    }
  }

  /**
   * Adds a new route to the routing table or registers an event listener.
   *
   * @param {String} name A route name
   * @param {String} path A string in the Express format, an array of strings, or a regular expression.
   * @param {Function|Array} handlers Asynchronous route handler function(s).
   */
  on(...params) {
    let name;
    let path;
    let handlers;

    name = (typeof params[1] === 'string' || params[1] instanceof String)
      ? params.shift()
      : shortid.generate();
    path = params.shift();
    handlers = params;

    const index = this.names.indexOf(name);

    if (path === 'error') {
      this.events[path] = handlers[0];
    } else if (index === -1) {
      this.names.push(name);
      this.routes.push(new Route(path, handlers));
    } else {
      this.routes[index] = new Route(path, handlers);
    }
  }

  generate(name, params) {
    const index = this.names.indexOf(name);

    if (index === -1) {
      return undefined;
    }

    return this.routes[index].generate(params);
  }

  async dispatch(state, cb) {
    if (typeof state === 'string' || state instanceof String) {
      state = { path: state };
    }
    cb = cb || emptyFunction;
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

    let value, result, done = false;

    async function next() {
      if (({ value, done } = handlers.next()) && !done) {
        const [match, handler] = value;
        state.params = match.params;
        return handler.length > 1 ?
          await handler(state, next) : await handler(state);
      }
    }

    while (!done) {
      result = await next();
      if (result) {
        state.statusCode = typeof state.statusCode === 'number' ? state.statusCode : 200;
        cb(state, result);
        return;
      }
    }

    if (this.events.error) {
      try {
        state.statusCode = 404;
        result = await this.events.error(state, new Error(`Cannot found a route matching '${state.path}'.`));
        cb(state, result);
      } catch (error) {
        state.statusCode = 500;
        result = await this.events.error(state, error);
        cb(state, result);
      }
    }
  }

}

export default Router;
