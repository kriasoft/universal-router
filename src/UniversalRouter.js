/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import pathToRegexp from 'path-to-regexp'
import matchRoute from './matchRoute'
import resolveRoute from './resolveRoute'

function isChildRoute(parentRoute, childRoute) {
  let route = childRoute
  while (route) {
    route = route.parent
    if (route === parentRoute) {
      return true
    }
  }
  return false
}

class UniversalRouter {
  constructor(routes, options = {}) {
    if (Object(routes) !== routes) {
      throw new TypeError('Invalid routes')
    }

    this.baseUrl = options.baseUrl || ''
    this.errorHandler = options.errorHandler
    this.resolveRoute = options.resolveRoute || resolveRoute
    this.context = Object.assign({ router: this }, options.context)
    this.root = Array.isArray(routes) ? { path: '', children: routes, parent: null } : routes
    this.root.parent = null
  }

  resolve(pathnameOrContext) {
    const context = Object.assign(
      {},
      this.context,
      typeof pathnameOrContext === 'string' ? { pathname: pathnameOrContext } : pathnameOrContext,
    )
    const match = matchRoute(
      this.root,
      this.baseUrl,
      context.pathname.substr(this.baseUrl.length),
      [],
      null,
    )
    const resolve = this.resolveRoute
    let matches = null
    let nextMatches = null
    let currentContext = context

    function next(resume, parent = matches.value.route, prevResult) {
      const routeToSkip = prevResult === null && matches.value.route
      matches = nextMatches || match.next(routeToSkip)
      nextMatches = null

      if (!resume) {
        if (matches.done || !isChildRoute(parent, matches.value.route)) {
          nextMatches = matches
          return Promise.resolve(null)
        }
      }

      if (matches.done) {
        const error = new Error('Page not found')
        error.context = context
        error.code = 404
        return Promise.reject(error)
      }

      currentContext = Object.assign({}, context, matches.value)

      return Promise.resolve(resolve(currentContext, matches.value.params)).then((result) => {
        if (result !== null && result !== undefined) {
          return result
        }
        return next(resume, parent, result)
      })
    }

    context.next = next

    return Promise.resolve()
      .then(() => next(true, this.root))
      .catch((error) => {
        error.context = error.context || currentContext
        error.code = error.code || 500
        if (this.errorHandler) {
          return this.errorHandler(error)
        }
        throw error
      })
  }
}

UniversalRouter.pathToRegexp = pathToRegexp

export default UniversalRouter
