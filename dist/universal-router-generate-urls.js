'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var pathToRegexp$1 = _interopDefault(require('path-to-regexp'));

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */
function isChildRoute(parentRoute, childRoute) {
    if (parentRoute === null)
        return false;
    let route = childRoute;
    while (route) {
        route = route.parent;
        if (route === parentRoute) {
            return true;
        }
    }
    return false;
}

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */
const { hasOwnProperty } = Object.prototype;
const cache = new Map();
function decodeParam(val) {
    try {
        return decodeURIComponent(val);
    }
    catch (err) {
        return val;
    }
}
function matchPath(route, pathname, parentKeys, parentParams) {
    const end = !route.children;
    const cacheKey = `${route.path || ''}|${end}`;
    let regexp = cache.get(cacheKey);
    if (!regexp) {
        const keys = [];
        regexp = {
            keys,
            pattern: pathToRegexp$1(route.path || '', keys, { end }),
        };
        cache.set(cacheKey, regexp);
    }
    const m = regexp.pattern.exec(pathname);
    if (!m) {
        return null;
    }
    const path = m[0];
    const params = { ...parentParams };
    for (let i = 1; i < m.length; i++) {
        const key = regexp.keys[i - 1];
        const prop = key.name;
        const value = m[i];
        if (value !== undefined || !hasOwnProperty.call(params, prop)) {
            if (key.repeat) {
                params[prop] = value ? value.split(key.delimiter).map(decodeParam) : [];
            }
            else {
                params[prop] = value ? decodeParam(value) : value;
            }
        }
    }
    return {
        path: !end && path.charAt(path.length - 1) === '/' ? path.substr(1) : path,
        keys: parentKeys.concat(regexp.keys),
        params,
    };
}

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */
function matchRoute(route, baseUrl, pathname, parentKeys, parentParams) {
    let match = null;
    let childMatches;
    let childIndex = 0;
    return {
        next(routeToSkip) {
            if (route === routeToSkip) {
                return { done: true, value: undefined };
            }
            if (!match) {
                match = matchPath(route, pathname, parentKeys, parentParams);
                if (match) {
                    return {
                        done: false,
                        value: {
                            route,
                            baseUrl,
                            path: match.path,
                            keys: match.keys,
                            params: match.params,
                        },
                    };
                }
            }
            if (match && route.children) {
                while (childIndex < route.children.length) {
                    if (!childMatches) {
                        const childRoute = route.children[childIndex];
                        childRoute.parent = route;
                        childMatches = matchRoute(childRoute, baseUrl + match.path, pathname.substr(match.path.length), match.keys, match.params);
                    }
                    const childMatch = childMatches.next(routeToSkip);
                    if (!childMatch.done) {
                        return {
                            done: false,
                            value: childMatch.value,
                        };
                    }
                    childMatches = null;
                    childIndex++;
                }
            }
            return { done: true, value: undefined };
        },
    };
}

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */
function resolveRoute(context, params) {
    if (typeof context.route.action === 'function') {
        return context.route.action(context, params);
    }
    return undefined;
}

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */
class UniversalRouter {
    constructor(routes, options = { context: {} }) {
        if (!routes || typeof routes !== 'object') {
            throw new TypeError('Invalid routes');
        }
        this.baseUrl = options.baseUrl || '';
        this.errorHandler = options.errorHandler;
        this.resolveRoute = options.resolveRoute || resolveRoute;
        this.context = { router: this, ...options.context };
        this.root = Array.isArray(routes) ? { path: '', children: routes, parent: null } : routes;
        this.root.parent = null;
    }
    resolve(pathnameOrContext) {
        const context = {
            ...this.context,
            ...(typeof pathnameOrContext === 'string'
                ? { pathname: pathnameOrContext }
                : pathnameOrContext),
        };
        const match = matchRoute(this.root, this.baseUrl, context.pathname.substr(this.baseUrl.length), [], null);
        const resolve = this.resolveRoute;
        let matches = null;
        let nextMatches = null;
        let currentContext = context;
        function next(resume, parent = matches && matches.value ? matches.value.route : null, prevResult) {
            const lastRoute = matches && matches.value ? matches.value.route : null;
            const routeToSkip = prevResult === null ? lastRoute : null;
            matches = nextMatches || match.next(routeToSkip);
            nextMatches = null;
            if (!resume) {
                if (matches.done || !isChildRoute(parent, matches.value.route)) {
                    nextMatches = matches;
                    return Promise.resolve(null);
                }
            }
            if (matches.done) {
                const error = new Error('Route not found');
                error.status = 404;
                return Promise.reject(error);
            }
            const resolveContext = { ...context, ...matches.value };
            currentContext = resolveContext;
            return Promise.resolve(resolve(resolveContext, matches.value.params)).then((result) => {
                if (result !== null && result !== undefined) {
                    return result;
                }
                return next(resume, parent, result);
            });
        }
        context.next = next;
        return Promise.resolve()
            .then(() => next(true, this.root))
            .catch((error) => {
            if (this.errorHandler) {
                return this.errorHandler(error, currentContext);
            }
            throw error;
        });
    }
}
UniversalRouter.pathToRegexp = pathToRegexp$1;

const { pathToRegexp } = UniversalRouter;
const cache$1 = new Map();
function cacheRoutes(routesByName, route, routes) {
    if (routesByName.has(route.name)) {
        throw new Error(`Route "${route.name}" already exists`);
    }
    if (route.name) {
        routesByName.set(route.name, route);
    }
    if (routes) {
        for (let i = 0; i < routes.length; i++) {
            const childRoute = routes[i];
            childRoute.parent = route;
            cacheRoutes(routesByName, childRoute, childRoute.children);
        }
    }
}
function generateUrls(router, options = {}) {
    if (!(router instanceof UniversalRouter)) {
        const duck = router;
        if (typeof duck !== 'object' || !duck || !duck.root) {
            throw new TypeError('An instance of UniversalRouter is expected');
        }
    }
    router.routesByName = router.routesByName || new Map();
    return (routeName, params) => {
        const map = router.routesByName;
        let route = map.get(routeName);
        if (!route) {
            map.clear(); // clear cache
            cacheRoutes(map, router.root, router.root.children);
            route = map.get(routeName);
            if (!route) {
                throw new Error(`Route "${routeName}" not found`);
            }
        }
        let regexp = cache$1.get(route.fullPath);
        if (!regexp) {
            let fullPath = '';
            let rt = route;
            while (rt) {
                const path = Array.isArray(rt.path) ? rt.path[0] : rt.path;
                if (path) {
                    fullPath = path + fullPath;
                }
                rt = rt.parent;
            }
            const tokens = pathToRegexp.parse(fullPath);
            const toPath = pathToRegexp.tokensToFunction(tokens);
            const keys = Object.create(null);
            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                if (typeof token !== 'string') {
                    keys[token.name] = true;
                }
            }
            regexp = { toPath, keys };
            cache$1.set(fullPath, regexp);
            route.fullPath = fullPath;
        }
        let url = router.baseUrl + regexp.toPath(params, options) || '/';
        if (options.stringifyQueryParams && params) {
            const queryParams = {};
            const keys = Object.keys(params);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (!regexp.keys[key]) {
                    queryParams[key] = params[key];
                }
            }
            const query = options.stringifyQueryParams(queryParams);
            if (query) {
                url += query.charAt(0) === '?' ? query : `?${query}`;
            }
        }
        return url;
    };
}

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

exports.UniversalRouter = UniversalRouter;
exports.generateUrls = generateUrls;
//# sourceMappingURL=universal-router-generate-urls.js.map
