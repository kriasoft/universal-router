/**
 * React Routing | http://www.kriasoft.com/react-routing
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import toRegExp from 'path-to-regexp';
import Match from './Match';

class Route {
  constructor(route) {
    this.name = route.name || null;
    this.path = route.path;

    // Support multiple naming conventions:
    //   handler, handlers, action, actions
    if (route.handlers) {
      this.handlers = route.handlers;
    } else if (route.actions) {
      this.handlers = route.actions;
    } else if (route.handler) {
      this.handlers = [route.handler];
    } else if (route.action) {
      this.handlers = [route.action];
    } else {
      throw new TypeError('Cannot initialize a new route without route handler(s).');
    }
  }

  match(path) {
    const m = this.regExp.exec(path);
    return m ? new Match(this, path, this.keys, m) : null;
  }
}

export default Route;
