/**
 * React Routing | http://www.kriasoft.com/react-routing
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import invariant from 'react/lib/invariant';
import toRegExp from 'path-to-regexp';
import Match from './Match';

const cache = Object.create(null);

class Route {
  constructor(path, handlers) {
    invariant(handlers.length > 0, 'Route must have at least one handler function.');
    this.path = path;
    this.handlers = handlers;
  }

  match(path) {
    let regExp = cache[path];

    if (!regExp) {
      regExp = { keys: [] };
      regExp.re = toRegExp(path, regExp.keys);
      cache[path] = regExp;
    }

    const match = regExp.re.exec(path);
    return match ? new Match(this, path, match) : null;
  }
}

export default Route;
