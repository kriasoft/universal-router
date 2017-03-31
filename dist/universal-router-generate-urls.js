/*! Universal Router | MIT License | https://www.kriasoft.com/universal-router/ */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('./universal-router.js')) :
	typeof define === 'function' && define.amd ? define(['./universal-router.js'], factory) :
	(global.generateUrls = factory(global.UniversalRouter));
}(this, (function (Router) { 'use strict';

Router = 'default' in Router ? Router['default'] : Router;

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/* eslint no-param-reassign: ['error', { props: false }] */

var cache = new Map();

function cacheRoutes(routesByName, route, routes) {
  if (routesByName[route.name]) {
    throw new Error('Route "' + route.name + '" already exists');
  }

  if (route.name) {
    routesByName[route.name] = route;
  }

  if (routes) {
    for (var i = 0; i < routes.length; i += 1) {
      var childRoute = routes[i];
      childRoute.parent = route;
      cacheRoutes(routesByName, childRoute, childRoute.children);
    }
  }
}

function generateUrls(router, options) {
  if (!(router instanceof Router)) {
    throw new TypeError('An instance of Router is expected');
  }

  router.routesByName = router.routesByName || {};

  return function (routeName, params) {
    var route = router.routesByName[routeName];
    if (!route) {
      router.routesByName = {}; // clear cache
      cacheRoutes(router.routesByName, router.root, router.root.children);

      route = router.routesByName[routeName];
      if (!route) {
        throw new Error('Route "' + routeName + '" not found');
      }
    }

    var path = '';
    while (route) {
      if (route.path !== '/') {
        var toPath = cache.get(route.path);
        if (!toPath) {
          toPath = Router.pathToRegexp.compile(route.path);
          cache.set(route.path, toPath);
        }
        path = toPath(params, options) + path;
      }
      route = route.parent;
    }

    return router.baseUrl + path || '/';
  };
}

Router.generateUrls = generateUrls;

return generateUrls;

})));
//# sourceMappingURL=universal-router-generate-urls.js.map
