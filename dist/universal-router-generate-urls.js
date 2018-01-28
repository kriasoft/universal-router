/*! Universal Router | MIT License | https://www.kriasoft.com/universal-router/ */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('./universal-router.js')) :
	typeof define === 'function' && define.amd ? define(['./universal-router.js'], factory) :
	(global.generateUrls = factory(global.UniversalRouter));
}(this, (function (UniversalRouter) { 'use strict';

var pathToRegexp = UniversalRouter.pathToRegexp;
var cache = new Map();

function cacheRoutes(routesByName, route, routes) {
  if (routesByName.has(route.name)) {
    throw new Error("Route \"" + route.name + "\" already exists");
  }

  if (route.name) {
    routesByName.set(route.name, route);
  }

  if (routes) {
    for (var i = 0; i < routes.length; i++) {
      var childRoute = routes[i];
      childRoute.parent = route;
      cacheRoutes(routesByName, childRoute, childRoute.children);
    }
  }
}

function generateUrls(router, options) {
  if (options === void 0) {
    options = {};
  }

  if (!(router instanceof UniversalRouter)) {
    throw new TypeError('An instance of UniversalRouter is expected');
  }

  router.routesByName = router.routesByName || new Map();
  return function (routeName, params) {
    var route = router.routesByName.get(routeName);

    if (!route) {
      router.routesByName.clear();
      cacheRoutes(router.routesByName, router.root, router.root.children);
      route = router.routesByName.get(routeName);

      if (!route) {
        throw new Error("Route \"" + routeName + "\" not found");
      }
    }

    var regexp = cache.get(route.fullPath);

    if (!regexp) {
      var fullPath = '';
      var rt = route;

      while (rt) {
        var path = Array.isArray(rt.path) ? rt.path[0] : rt.path;

        if (path) {
          fullPath = path + fullPath;
        }

        rt = rt.parent;
      }

      var tokens = pathToRegexp.parse(fullPath);
      var toPath = pathToRegexp.tokensToFunction(tokens);
      var keys = Object.create(null);

      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] !== 'string') {
          keys[tokens[i].name] = true;
        }
      }

      regexp = {
        toPath: toPath,
        keys: keys
      };
      cache.set(fullPath, regexp);
      route.fullPath = fullPath;
    }

    var url = router.baseUrl + regexp.toPath(params, options) || '/';

    if (options.stringifyQueryParams && params) {
      var queryParams = {};

      var _keys = Object.keys(params);

      for (var _i = 0; _i < _keys.length; _i++) {
        var key = _keys[_i];

        if (!regexp.keys[key]) {
          queryParams[key] = params[key];
        }
      }

      var query = options.stringifyQueryParams(queryParams);

      if (query) {
        url += query.charAt(0) === '?' ? query : "?" + query;
      }
    }

    return url;
  };
}

return generateUrls;

})));
//# sourceMappingURL=universal-router-generate-urls.js.map
