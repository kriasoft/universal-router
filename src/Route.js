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
  constructor(path, actions) {
    this.path = path;
    this.actions = actions;
    this.regExp = toRegExp(path, this.keys = []);
  }

  match(path) {
    const m = this.regExp.exec(path);
    return m ? new Match(this, path, this.keys, m) : null;
  }
}

export default Route;
