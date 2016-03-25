/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

class Match {
  constructor(route, path, keys, match) {
    this.route = route;
    this.path = path;
    this.params = Object.create(null);
    for (let i = 1; i < match.length; i++) {
      this.params[keys[i - 1].name] = decodeParam(match[i]);
    }
  }
}

function decodeParam(val){
  if (!(typeof val === 'string' || val instanceof String)) {
    return val;
  }

  try {
    return decodeURIComponent(val);
  } catch (e) {
    var err = new TypeError(`Failed to decode param '${val}'`);
    err.status = 400;
    throw err;
  }
}

export default Match;
