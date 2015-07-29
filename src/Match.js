/**
 * React Routing | http://www.kriasoft.com/react-routing
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
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
