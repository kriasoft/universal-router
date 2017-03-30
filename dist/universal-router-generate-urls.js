/*! Universal Router | MIT License | https://www.kriasoft.com/universal-router/ */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.generateUrls = factory());
}(this, (function () { 'use strict';

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

var cache = new Map();

function generateUrls(router) {
  var pathToRegexp = router.constructor.pathToRegexp;
  var routesByName = {};

  function update(route, routes) {
    if (routesByName[route.name]) {
      throw new Error('Route "' + route.name + '" already exists');
    }

    routesByName[route.name] = route;

    if (routes) {
      for (var i = 0; i < routes.length; i += 1) {
        var childRoute = routes[i];
        childRoute.parent = route;
        update(childRoute, childRoute.children);
      }
    }
  }

  return function (routeName, params) {
    var route = routesByName[routeName];
    if (!route) {
      routesByName = {};
      update(router.root, router.root.children);
      route = routesByName[routeName];

      if (!route) {
        throw new Error('Route "' + routeName + '" not found');
      }
    }

    var path = '';
    while (route) {
      if (route.path !== '/') {
        var toPath = cache.get(route.path);
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

return generateUrls;

})));
//# sourceMappingURL=universal-router-generate-urls.js.map
