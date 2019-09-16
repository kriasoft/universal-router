/*! Universal Router | MIT License | https://www.kriasoft.com/universal-router/ */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.UniversalRouterSync = factory());
}(this, function () { 'use strict';

  var pathToRegexp_1 = pathToRegexp;
  var parse_1 = parse;
  var compile_1 = compile;
  var tokensToFunction_1 = tokensToFunction;
  var tokensToRegExp_1 = tokensToRegExp;
  var DEFAULT_DELIMITER = '/';
  var PATH_REGEXP = new RegExp(['(\\\\.)', '(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?'].join('|'), 'g');

  function parse(str, options) {
    var tokens = [];
    var key = 0;
    var index = 0;
    var path = '';
    var defaultDelimiter = options && options.delimiter || DEFAULT_DELIMITER;
    var whitelist = options && options.whitelist || undefined;
    var pathEscaped = false;
    var res;

    while ((res = PATH_REGEXP.exec(str)) !== null) {
      var m = res[0];
      var escaped = res[1];
      var offset = res.index;
      path += str.slice(index, offset);
      index = offset + m.length;

      if (escaped) {
        path += escaped[1];
        pathEscaped = true;
        continue;
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
        pattern: pattern ? escapeGroup(pattern) : '[^' + escapeString(delimiter === defaultDelimiter ? delimiter : delimiter + defaultDelimiter) + ']+?'
      });
    }

    if (path || index < str.length) {
      tokens.push(path + str.substr(index));
    }

    return tokens;
  }

  function compile(str, options) {
    return tokensToFunction(parse(str, options), options);
  }

  function tokensToFunction(tokens, options) {
    var matches = new Array(tokens.length);

    for (var i = 0; i < tokens.length; i++) {
      if (typeof tokens[i] === 'object') {
        matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$', flags(options));
      }
    }

    return function (data, options) {
      var path = '';
      var encode = options && options.encode || encodeURIComponent;
      var validate = options ? options.validate !== false : true;

      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        if (typeof token === 'string') {
          path += token;
          continue;
        }

        var value = data ? data[token.name] : undefined;
        var segment;

        if (Array.isArray(value)) {
          if (!token.repeat) {
            throw new TypeError('Expected "' + token.name + '" to not repeat, but got array');
          }

          if (value.length === 0) {
            if (token.optional) continue;
            throw new TypeError('Expected "' + token.name + '" to not be empty');
          }

          for (var j = 0; j < value.length; j++) {
            segment = encode(value[j], token);

            if (validate && !matches[i].test(segment)) {
              throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '"');
            }

            path += (j === 0 ? token.prefix : token.delimiter) + segment;
          }

          continue;
        }

        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          segment = encode(String(value), token);

          if (validate && !matches[i].test(segment)) {
            throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but got "' + segment + '"');
          }

          path += token.prefix + segment;
          continue;
        }

        if (token.optional) continue;
        throw new TypeError('Expected "' + token.name + '" to be ' + (token.repeat ? 'an array' : 'a string'));
      }

      return path;
    };
  }

  function escapeString(str) {
    return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
  }

  function escapeGroup(group) {
    return group.replace(/([=!:$/()])/g, '\\$1');
  }

  function flags(options) {
    return options && options.sensitive ? '' : 'i';
  }

  function regexpToRegexp(path, keys) {
    if (!keys) return path;
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

    return path;
  }

  function arrayToRegexp(path, keys, options) {
    var parts = [];

    for (var i = 0; i < path.length; i++) {
      parts.push(pathToRegexp(path[i], keys, options).source);
    }

    return new RegExp('(?:' + parts.join('|') + ')', flags(options));
  }

  function stringToRegexp(path, keys, options) {
    return tokensToRegExp(parse(path, options), keys, options);
  }

  function tokensToRegExp(tokens, keys, options) {
    options = options || {};
    var strict = options.strict;
    var start = options.start !== false;
    var end = options.end !== false;
    var delimiter = options.delimiter || DEFAULT_DELIMITER;
    var endsWith = [].concat(options.endsWith || []).map(escapeString).concat('$').join('|');
    var route = start ? '^' : '';

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];

      if (typeof token === 'string') {
        route += escapeString(token);
      } else {
        var capture = token.repeat ? '(?:' + token.pattern + ')(?:' + escapeString(token.delimiter) + '(?:' + token.pattern + '))*' : token.pattern;
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
      var isEndDelimited = typeof endToken === 'string' ? endToken[endToken.length - 1] === delimiter : endToken === undefined;
      if (!strict) route += '(?:' + escapeString(delimiter) + '(?=' + endsWith + '))?';
      if (!isEndDelimited) route += '(?=' + escapeString(delimiter) + '|' + endsWith + ')';
    }

    return new RegExp(route, flags(options));
  }

  function pathToRegexp(path, keys, options) {
    if (path instanceof RegExp) {
      return regexpToRegexp(path, keys);
    }

    if (Array.isArray(path)) {
      return arrayToRegexp(path, keys, options);
    }

    return stringToRegexp(path, keys, options);
  }
  pathToRegexp_1.parse = parse_1;
  pathToRegexp_1.compile = compile_1;
  pathToRegexp_1.tokensToFunction = tokensToFunction_1;
  pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var cache = new Map();

  function decodeParam(val) {
    try {
      return decodeURIComponent(val);
    } catch (err) {
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
        pattern: pathToRegexp_1(route.path || '', keys, {
          end: end
        })
      };
      cache.set(cacheKey, regexp);
    }

    var m = regexp.pattern.exec(pathname);

    if (!m) {
      return null;
    }

    var path = m[0];
    var params = Object.assign({}, parentParams);

    for (var i = 1; i < m.length; i++) {
      var key = regexp.keys[i - 1];
      var prop = key.name;
      var value = m[i];

      if (value !== undefined || !hasOwnProperty.call(params, prop)) {
        if (key.repeat) {
          params[prop] = value ? value.split(key.delimiter).map(decodeParam) : [];
        } else {
          params[prop] = value ? decodeParam(value) : value;
        }
      }
    }

    return {
      path: !end && path.charAt(path.length - 1) === '/' ? path.substr(1) : path,
      keys: parentKeys.concat(regexp.keys),
      params: params
    };
  }

  function matchRoute(route, baseUrl, pathname, parentKeys, parentParams) {
    var match;
    var childMatches;
    var childIndex = 0;
    return {
      next: function next(routeToSkip) {
        if (route === routeToSkip) {
          return {
            done: true
          };
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
                params: match.params
              }
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
                value: childMatch.value
              };
            }

            childMatches = null;
            childIndex++;
          }
        }

        return {
          done: true
        };
      }
    };
  }

  function resolveRoute(context, params) {
    if (typeof context.route.action === 'function') {
      return context.route.action(context, params);
    }

    return undefined;
  }

  function isChildRoute(parentRoute, childRoute) {
    var route = childRoute;

    while (route) {
      route = route.parent;

      if (route === parentRoute) {
        return true;
      }
    }

    return false;
  }

  var UniversalRouterSync = function () {
    function UniversalRouterSync(routes, options) {
      if (options === void 0) {
        options = {};
      }

      if (!routes || typeof routes !== 'object') {
        throw new TypeError('Invalid routes');
      }

      this.baseUrl = options.baseUrl || '';
      this.errorHandler = options.errorHandler;
      this.resolveRoute = options.resolveRoute || resolveRoute;
      this.context = Object.assign({
        router: this
      }, options.context);
      this.root = Array.isArray(routes) ? {
        path: '',
        children: routes,
        parent: null
      } : routes;
      this.root.parent = null;
    }

    var _proto = UniversalRouterSync.prototype;

    _proto.resolve = function resolve(pathnameOrContext) {
      var context = Object.assign({}, this.context, {}, typeof pathnameOrContext === 'string' ? {
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

        var routeToSkip = prevResult === null && !matches.done && matches.value.route;
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

        currentContext = Object.assign({}, context, {}, matches.value);
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
  }();

  UniversalRouterSync.pathToRegexp = pathToRegexp_1;

  return UniversalRouterSync;

}));
//# sourceMappingURL=universal-router-sync.js.map
