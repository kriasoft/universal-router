/*! Universal Router | MIT License | https://www.kriasoft.com/universal-router/ */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('./universal-router.js')) :
  typeof define === 'function' && define.amd ? define(['./universal-router.js'], factory) :
  (global = global || self, global.sync = factory(global.UniversalRouter));
}(this, function (UniversalRouter) { 'use strict';

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }

  var matchRoute = UniversalRouter.matchRoute,
      isChildRoute = UniversalRouter.isChildRoute;

  var UniversalRouterSync = function (_UniversalRouter) {
    _inheritsLoose(UniversalRouterSync, _UniversalRouter);

    function UniversalRouterSync() {
      return _UniversalRouter.apply(this, arguments) || this;
    }

    var _proto = UniversalRouterSync.prototype;

    _proto.resolve = function resolve(pathnameOrContext) {
      var context = Object.assign({}, this.context, typeof pathnameOrContext === 'string' ? {
        pathname: pathnameOrContext
      } : pathnameOrContext);
      var match = matchRoute(this.root, this.baseUrl, context.pathname.substr(this.baseUrl.length), [], null);
      var resolve = this.resolveRoute;
      var matches = null;
      var nextMatches = null;
      var currentContext = context;

      function next(resume, parent, prevResult) {
        if (parent === void 0) {
          parent = matches.value.route;
        }

        var routeToSkip = prevResult === null && matches.value.route;
        matches = nextMatches || match.next(routeToSkip);
        nextMatches = null;

        if (!resume) {
          if (matches.done || !isChildRoute(parent, matches.value.route)) {
            nextMatches = matches;
            return null;
          }
        }

        if (matches.done) {
          var error = new Error('Route not found');
          error.status = 404;
          throw error;
        }

        currentContext = Object.assign({}, context, matches.value);
        var result = resolve(currentContext, matches.value.params);

        if (result !== null && result !== undefined) {
          return result;
        }

        return next(resume, parent, result);
      }

      context.next = next;

      try {
        return next(true, this.root);
      } catch (error) {
        if (this.errorHandler) {
          return this.errorHandler(error, currentContext);
        }

        throw error;
      }
    };

    return UniversalRouterSync;
  }(UniversalRouter);

  return UniversalRouterSync;

}));
//# sourceMappingURL=universal-router-sync.js.map
