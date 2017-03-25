/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-present Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

const cache = new Map();

function generateUrls(router) {
  const pathToRegexp = router.constructor.pathToRegexp;
  let routesByName = {};

  function update(route, routes) {
    if (routesByName[route.name]) {
      throw new Error(`Route "${route.name}" already exists`);
    }

    routesByName[route.name] = route;

    if (routes) {
      for (let i = 0; i < routes.length; i += 1) {
        const childRoute = routes[i];
        childRoute.parent = route;
        update(childRoute, childRoute.children);
      }
    }
  }

  return (routeName, params) => {
    let route = routesByName[routeName];
    if (!route) {
      routesByName = {};
      update(router.root, router.root.children);
      route = routesByName[routeName];

      if (!route) {
        throw new Error(`Route "${routeName}" not found`);
      }
    }

    let path = '';
    while (route) {
      if (route.path !== '/') {
        let toPath = cache.get(route.path);
        if (!toPath) {
          toPath = pathToRegexp.compile(route.path);
          cache.set(route.path, toPath);
        }
        path = toPath(params) + path;
      }
      route = route.parent;
    }

    return router.baseUrl + path || '/';
  };
}

export default generateUrls;
