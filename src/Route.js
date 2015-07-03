/**
 * React Routing | https://www.kriasoft.com/react-routing
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import toRegExp from 'path-to-regexp';

const cache = Object.create(null);

class Route {
  constructor(path, ...handlers) {
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
    return match ? new Match(path) : null;
  }
}
