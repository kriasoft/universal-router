/**
 * React Routing | http://www.kriasoft.com/react-routing
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import toRegExp from 'path-to-regexp';
import Match from './Match';

class Route {
  constructor(path, handlers) {
    this.path = path;
    this.handlers = handlers;
    this.regExp = toRegExp(path, this.keys = []);
    this.toPath = toRegExp.compile(path);
  }

  match(path) {
    const m = this.regExp.exec(path);
    return m ? new Match(this, path, this.keys, m) : null;
  }

  generate(params) {
    return this.toPath(params);
  }
}

export default Route;
