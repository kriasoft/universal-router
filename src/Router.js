/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import pathToRegexp from 'path-to-regexp';
import matchPath from './matchPath';
import matchRoute from './matchRoute';
import resolveRoute from './resolveRoute';

class Router {
  constructor(routes, options = {}) {
    if (Object(routes) !== routes) {
      throw new TypeError('Invalid routes');
    }

    this.baseUrl = options.baseUrl || '';
    this.resolveRoute = options.resolveRoute || resolveRoute;
    this.context = Object.assign({ router: this }, options.context);
    this.root = Array.isArray(routes) ? { path: '/', children: routes, parent: null } : routes;
    this.root.parent = null;
  }

  resolve(pathOrContext) {
    const context = Object.assign({}, this.context,
      typeof pathOrContext === 'string' ? { path: pathOrContext } : pathOrContext);
    const match = matchRoute(this.root, this.baseUrl, context.path.substr(this.baseUrl.length));
    const resolve = this.resolveRoute;
    let matches;
    let parent;

    function next(resume) {
      parent = matches ? matches.value.route.parent : null;
      matches = match.next();

      if (matches.done) {
        return Promise.reject(Object.assign(
          new Error('Page not found'),
          { context, status: 404, statusCode: 404 },
        ));
      }

      return Promise.resolve(resolve(
        Object.assign({}, context, matches.value),
        matches.value.params,
      )).then((result) => {
        if (result !== null && result !== undefined) {
          return result;
        }

        if (resume || parent === matches.value.route.parent) {
          return next(resume);
        }

        return result;
      });
    }

    context.url = context.path;
    context.next = next;

    return next(true);
  }
}

Router.pathToRegexp = pathToRegexp;
Router.matchPath = matchPath;
Router.matchRoute = matchRoute;
Router.resolveRoute = resolveRoute;

export default Router;
