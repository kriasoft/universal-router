/**
 * React Routing | https://www.kriasoft.com/react-routing
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import toRegExp from 'path-to-regexp';

const cache = { regExps: Object.create(null) };

class Router {

  /**
   * Creates a new instance of the `Router` class.
   */
  constructor() {
    this.routes = [];
    this.events = Object.create(null);
  }

  /**
   * Adds a new route to the routing table.
   *
   * @param {String} path A string in the Express format, an array of strings, or a regular expression.
   * @param {Function|Array} handlers Asynchronous route handler function(s).
   */
  route(path, ...handlers) {
    this.routes.push({ path, handlers });
  }

  /**
   * Registers a new callback function for the given event.
   *
   * @param {String} event The name of the event.
   * @param {Function} callback Callback function.
   */
  on(event, callback) {
    this.events[event] = callback;
  }

  /**
   * Finds a route matching the provided URL string.
   *
   * @param {String} path The "path" portion of a URL string.
   */
  *match(path) {
    for (let i = 0; i < this.routes.length; i++) {
      let route = this.routes[i];
      let { regExp, regExpKeys } = cache.regExps[route.path] || { regExp: null, regExpKeys: [] };

      if (!regExp) {
        regExp = toRegExp(route.path, regExpKeys);
        cache.regExps[route.path] = { regExp, regExpKeys };
      }

      let match = regExp.exec(path);

      if (match) {
        yield [route, regExpKeys, match];
      }
    }
  }

}

export default Router;
