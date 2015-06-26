/**
 * React Routing | https://www.kriasoft.com/react-routing
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

class Router {

  constructor() {
    this.routes = [];
  }

  on(path, ...handlers) {
    this.routes.push({ path, handlers });
  }

}

export default Router;
