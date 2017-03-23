/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import toRegExp from 'path-to-regexp';

function resolvePath(route, routeName) {
  const routePath = (route.path === '/') ? '' : route.path;

  if (route.name && route.name === routeName) {
    return routePath;
  }

  if (route.children) {
    for (let i = 0; i < route.children.length; i += 1) {
      let resultPath = resolvePath(route.children[i], routeName);

      if (resultPath !== null) {
        resultPath = routePath + resultPath;
        return resultPath.startsWith('/') ? resultPath : `/${resultPath}`;
      }
    }
  }

  return null;
}

function href(routes, routeName, routeParams = {}, options = { pretty: false }) {
  const root = Array.isArray(routes) ? { path: '/', children: routes } : routes;
  const path = resolvePath(root, routeName);

  if (path === null) {
    return null;
  }

  return toRegExp.compile(path)(routeParams, options);
}

export default href;
