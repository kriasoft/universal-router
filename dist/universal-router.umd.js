(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.UniversalRouter = factory());
}(this, function () { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    /**
     * Expose `pathToRegexp`.
     */
    var pathToRegexp_1 = pathToRegexp;
    var parse_1 = parse;
    var compile_1 = compile;
    var tokensToFunction_1 = tokensToFunction;
    var tokensToRegExp_1 = tokensToRegExp;

    /**
     * Default configs.
     */
    var DEFAULT_DELIMITER = '/';

    /**
     * The main path matching regexp utility.
     *
     * @type {RegExp}
     */
    var PATH_REGEXP = new RegExp([
      // Match escaped characters that would otherwise appear in future matches.
      // This allows the user to escape special characters that won't transform.
      '(\\\\.)',
      // Match Express-style parameters and un-named parameters with a prefix
      // and optional suffixes. Matches appear as:
      //
      // ":test(\\d+)?" => ["test", "\d+", undefined, "?"]
      // "(\\d+)"  => [undefined, undefined, "\d+", undefined]
      '(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?'
    ].join('|'), 'g');

    /**
     * Parse a string for the raw tokens.
     *
     * @param  {string}  str
     * @param  {Object=} options
     * @return {!Array}
     */
    function parse (str, options) {
      var tokens = [];
      var key = 0;
      var index = 0;
      var path = '';
      var defaultDelimiter = (options && options.delimiter) || DEFAULT_DELIMITER;
      var whitelist = (options && options.whitelist) || undefined;
      var pathEscaped = false;
      var res;

      while ((res = PATH_REGEXP.exec(str)) !== null) {
        var m = res[0];
        var escaped = res[1];
        var offset = res.index;
        path += str.slice(index, offset);
        index = offset + m.length;

        // Ignore already escaped sequences.
        if (escaped) {
          path += escaped[1];
          pathEscaped = true;
          continue
        }

        var prev = '';
        var name = res[2];
        var capture = res[3];
        var group = res[4];
        var modifier = res[5];

        if (!pathEscaped && path.length) {
          var k = path.length - 1;
          var c = path[k];
          var matches = whitelist ? whitelist.indexOf(c) > -1 : true;

          if (matches) {
            prev = c;
            path = path.slice(0, k);
          }
        }

        // Push the current path onto the tokens.
        if (path) {
          tokens.push(path);
          path = '';
          pathEscaped = false;
        }

        var repeat = modifier === '+' || modifier === '*';
        var optional = modifier === '?' || modifier === '*';
        var pattern = capture || group;
        var delimiter = prev || defaultDelimiter;

        tokens.push({
          name: name || key++,
          prefix: prev,
          delimiter: delimiter,
          optional: optional,
          repeat: repeat,
          pattern: pattern
            ? escapeGroup(pattern)
            : '[^' + escapeString(delimiter === defaultDelimiter ? delimiter : (delimiter + defaultDelimiter)) + ']+?'
        });
      }

      // Push any remaining characters.
      if (path || index < str.length) {
        tokens.push(path + str.substr(index));
      }

      return tokens
    }

    /**
     * Compile a string to a template function for the path.
     *
     * @param  {string}             str
     * @param  {Object=}            options
     * @return {!function(Object=, Object=)}
     */
    function compile (str, options) {
      return tokensToFunction(parse(str, options))
    }

    /**
     * Expose a method for transforming tokens into the path function.
     */
    function tokensToFunction (tokens) {
      // Compile all the tokens into regexps.
      var matches = new Array(tokens.length);

      // Compile all the patterns before compilation.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] === 'object') {
          matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$');
        }
      }

      return function (data, options) {
        var path = '';
        var encode = (options && options.encode) || encodeURIComponent;

        for (var i = 0; i < tokens.length; i++) {
          var token = tokens[i];

          if (typeof token === 'string') {
            path += token;
            continue
          }

          var value = data ? data[token.name] : undefined;
          var segment;

          if (Array.isArray(value)) {
            if (!token.repeat) {
              throw new TypeError('Expected "' + token.name + '" to not repeat, but got array')
            }

            if (value.length === 0) {
              if (token.optional) continue

              throw new TypeError('Expected "' + token.name + '" to not be empty')
            }

            for (var j = 0; j < value.length; j++) {
              segment = encode(value[j], token);

              if (!matches[i].test(segment)) {
                throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '"')
              }

              path += (j === 0 ? token.prefix : token.delimiter) + segment;
            }

            continue
          }

          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            segment = encode(String(value), token);

            if (!matches[i].test(segment)) {
              throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but got "' + segment + '"')
            }

            path += token.prefix + segment;
            continue
          }

          if (token.optional) continue

          throw new TypeError('Expected "' + token.name + '" to be ' + (token.repeat ? 'an array' : 'a string'))
        }

        return path
      }
    }

    /**
     * Escape a regular expression string.
     *
     * @param  {string} str
     * @return {string}
     */
    function escapeString (str) {
      return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')
    }

    /**
     * Escape the capturing group by escaping special characters and meaning.
     *
     * @param  {string} group
     * @return {string}
     */
    function escapeGroup (group) {
      return group.replace(/([=!:$/()])/g, '\\$1')
    }

    /**
     * Get the flags for a regexp from the options.
     *
     * @param  {Object} options
     * @return {string}
     */
    function flags (options) {
      return options && options.sensitive ? '' : 'i'
    }

    /**
     * Pull out keys from a regexp.
     *
     * @param  {!RegExp} path
     * @param  {Array=}  keys
     * @return {!RegExp}
     */
    function regexpToRegexp (path, keys) {
      if (!keys) return path

      // Use a negative lookahead to match only capturing groups.
      var groups = path.source.match(/\((?!\?)/g);

      if (groups) {
        for (var i = 0; i < groups.length; i++) {
          keys.push({
            name: i,
            prefix: null,
            delimiter: null,
            optional: false,
            repeat: false,
            pattern: null
          });
        }
      }

      return path
    }

    /**
     * Transform an array into a regexp.
     *
     * @param  {!Array}  path
     * @param  {Array=}  keys
     * @param  {Object=} options
     * @return {!RegExp}
     */
    function arrayToRegexp (path, keys, options) {
      var parts = [];

      for (var i = 0; i < path.length; i++) {
        parts.push(pathToRegexp(path[i], keys, options).source);
      }

      return new RegExp('(?:' + parts.join('|') + ')', flags(options))
    }

    /**
     * Create a path regexp from string input.
     *
     * @param  {string}  path
     * @param  {Array=}  keys
     * @param  {Object=} options
     * @return {!RegExp}
     */
    function stringToRegexp (path, keys, options) {
      return tokensToRegExp(parse(path, options), keys, options)
    }

    /**
     * Expose a function for taking tokens and returning a RegExp.
     *
     * @param  {!Array}  tokens
     * @param  {Array=}  keys
     * @param  {Object=} options
     * @return {!RegExp}
     */
    function tokensToRegExp (tokens, keys, options) {
      options = options || {};

      var strict = options.strict;
      var start = options.start !== false;
      var end = options.end !== false;
      var delimiter = options.delimiter || DEFAULT_DELIMITER;
      var endsWith = [].concat(options.endsWith || []).map(escapeString).concat('$').join('|');
      var route = start ? '^' : '';

      // Iterate over the tokens and create our regexp string.
      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        if (typeof token === 'string') {
          route += escapeString(token);
        } else {
          var capture = token.repeat
            ? '(?:' + token.pattern + ')(?:' + escapeString(token.delimiter) + '(?:' + token.pattern + '))*'
            : token.pattern;

          if (keys) keys.push(token);

          if (token.optional) {
            if (!token.prefix) {
              route += '(' + capture + ')?';
            } else {
              route += '(?:' + escapeString(token.prefix) + '(' + capture + '))?';
            }
          } else {
            route += escapeString(token.prefix) + '(' + capture + ')';
          }
        }
      }

      if (end) {
        if (!strict) route += '(?:' + escapeString(delimiter) + ')?';

        route += endsWith === '$' ? '$' : '(?=' + endsWith + ')';
      } else {
        var endToken = tokens[tokens.length - 1];
        var isEndDelimited = typeof endToken === 'string'
          ? endToken[endToken.length - 1] === delimiter
          : endToken === undefined;

        if (!strict) route += '(?:' + escapeString(delimiter) + '(?=' + endsWith + '))?';
        if (!isEndDelimited) route += '(?=' + escapeString(delimiter) + '|' + endsWith + ')';
      }

      return new RegExp(route, flags(options))
    }

    /**
     * Normalize the given path string, returning a regular expression.
     *
     * An empty array can be passed in for the keys, which will hold the
     * placeholder key descriptions. For example, using `/user/:id`, `keys` will
     * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
     *
     * @param  {(string|RegExp|Array)} path
     * @param  {Array=}                keys
     * @param  {Object=}               options
     * @return {!RegExp}
     */
    function pathToRegexp (path, keys, options) {
      if (path instanceof RegExp) {
        return regexpToRegexp(path, keys)
      }

      if (Array.isArray(path)) {
        return arrayToRegexp(/** @type {!Array} */ (path), keys, options)
      }

      return stringToRegexp(/** @type {string} */ (path), keys, options)
    }
    pathToRegexp_1.parse = parse_1;
    pathToRegexp_1.compile = compile_1;
    pathToRegexp_1.tokensToFunction = tokensToFunction_1;
    pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

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
        var route = childRoute;
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
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var cache = new Map();
    function decodeParam(val) {
        try {
            return decodeURIComponent(val);
        }
        catch (err) {
            return val;
        }
    }
    function matchPath(route, pathname, parentKeys, parentParams) {
        var end = !route.children;
        var cacheKey = (route.path || '') + "|" + end;
        var regexp = cache.get(cacheKey);
        if (!regexp) {
            var keys = [];
            regexp = {
                keys: keys,
                pattern: pathToRegexp_1(route.path || '', keys, { end: end }),
            };
            cache.set(cacheKey, regexp);
        }
        var m = regexp.pattern.exec(pathname);
        if (!m) {
            return null;
        }
        var path = m[0];
        var params = __assign({}, parentParams);
        for (var i = 1; i < m.length; i++) {
            var key = regexp.keys[i - 1];
            var prop = key.name;
            var value = m[i];
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
            params: params,
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
        var match = null;
        var childMatches;
        var childIndex = 0;
        return {
            next: function (routeToSkip) {
                if (route === routeToSkip) {
                    return { done: true, value: undefined };
                }
                if (!match) {
                    match = matchPath(route, pathname, parentKeys, parentParams);
                    if (match) {
                        return {
                            done: false,
                            value: {
                                route: route,
                                baseUrl: baseUrl,
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
                            var childRoute = route.children[childIndex];
                            childRoute.parent = route;
                            childMatches = matchRoute(childRoute, baseUrl + match.path, pathname.substr(match.path.length), match.keys, match.params);
                        }
                        var childMatch = childMatches.next(routeToSkip);
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
    var UniversalRouter = /** @class */ (function () {
        function UniversalRouter(routes, options) {
            if (options === void 0) { options = { context: {} }; }
            if (!routes || typeof routes !== 'object') {
                throw new TypeError('Invalid routes');
            }
            this.baseUrl = options.baseUrl || '';
            this.errorHandler = options.errorHandler;
            this.resolveRoute = options.resolveRoute || resolveRoute;
            this.context = __assign({ router: this }, options.context);
            this.root = Array.isArray(routes) ? { path: '', children: routes, parent: null } : routes;
            this.root.parent = null;
        }
        UniversalRouter.prototype.resolve = function (pathnameOrContext) {
            var _this = this;
            var context = __assign({}, this.context, (typeof pathnameOrContext === 'string'
                ? { pathname: pathnameOrContext }
                : pathnameOrContext));
            var match = matchRoute(this.root, this.baseUrl, context.pathname.substr(this.baseUrl.length), [], null);
            var resolve = this.resolveRoute;
            var matches = null;
            var nextMatches = null;
            var currentContext = context;
            function next(resume, parent, prevResult) {
                if (parent === void 0) { parent = matches && matches.value ? matches.value.route : null; }
                var lastRoute = matches && matches.value ? matches.value.route : null;
                var routeToSkip = prevResult === null ? lastRoute : null;
                matches = nextMatches || match.next(routeToSkip);
                nextMatches = null;
                if (!resume) {
                    if (matches.done || !isChildRoute(parent, matches.value.route)) {
                        nextMatches = matches;
                        return Promise.resolve(null);
                    }
                }
                if (matches.done) {
                    var error = new Error('Route not found');
                    error.status = 404;
                    return Promise.reject(error);
                }
                var resolveContext = __assign({}, context, matches.value);
                currentContext = resolveContext;
                return Promise.resolve(resolve(resolveContext, matches.value.params)).then(function (result) {
                    if (result !== null && result !== undefined) {
                        return result;
                    }
                    return next(resume, parent, result);
                });
            }
            context.next = next;
            return Promise.resolve()
                .then(function () { return next(true, _this.root); })
                .catch(function (error) {
                if (_this.errorHandler) {
                    return _this.errorHandler(error, currentContext);
                }
                throw error;
            });
        };
        UniversalRouter.pathToRegexp = pathToRegexp_1;
        return UniversalRouter;
    }());

    return UniversalRouter;

}));
//# sourceMappingURL=universal-router.umd.js.map
