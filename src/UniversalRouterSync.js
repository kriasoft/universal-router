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
import isChildRoute from './isChildRoute'

class UniversalRouterSync {
  constructor(routes, options = {}) {
    if (!routes || typeof routes !== 'object') {
      throw new TypeError('Invalid routes')
    }

    this.baseUrl = options.baseUrl || ''
    this.errorHandler = options.errorHandler
    this.resolveRoute = options.resolveRoute || resolveRoute
    this.context = { router: this, ...options.context }
    this.root = Array.isArray(routes) ? { path: '', children: routes, parent: null } : routes
    this.root.parent = null
  }

  resolve(pathnameOrContext) {
    const context = {
      ...this.context,
      ...(typeof pathnameOrContext === 'string'
        ? { pathname: pathnameOrContext }
        : pathnameOrContext),
    }
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
      const routeToSkip = prevResult === null && !matches.done && matches.value.route
      matches = nextMatches || match.next(routeToSkip)
      nextMatches = null

      if (!resume) {
        if (matches.done || !isChildRoute(parent, matches.value.route)) {
          nextMatches = matches
          return null
        }
      }

      if (matches.done) {
        const error = new Error('Route not found')
        error.status = 404
        throw error
      }

      currentContext = { ...context, ...matches.value }

      const result = resolve(currentContext, matches.value.params)
      if (result !== null && result !== undefined) {
        return result
      }
      return next(resume, parent, result)
    }

    context.next = next

    try {
      return next(true, this.root)
    } catch (error) {
      if (this.errorHandler) {
        return this.errorHandler(error, currentContext)
      }
      throw error
    }
  }
}

UniversalRouterSync.pathToRegexp = pathToRegexp

export default UniversalRouterSync
