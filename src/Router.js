/**
 * React Routing | https://www.kriasoft.com/react-routing
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import toRegExp from 'path-to-regexp';

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
   * Adds a new route to the routing table.
   *
   * @param {String} path A string in the Express format, an array of strings, or a regular expression.
   * @param {Function|Array} handlers Asynchronous route handler function(s).
   */
  on(path, ...handlers) {
    if (eventTypes.some(x => x === path)) {
      this.events[path] = handlers[0];
    } else {
      this.routes.push({ path, handlers });
    }
  }

  dispatch(path, callback) {

  }

}

export default Router;
