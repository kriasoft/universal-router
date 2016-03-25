/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
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
