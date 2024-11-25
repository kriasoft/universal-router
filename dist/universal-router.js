/*! Universal Router | MIT License | https://www.kriasoft.com/universal-router/ */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.UniversalRouter = factory());
})(this, (function () { 'use strict';

    function lexer(str) {
      var tokens = [];
      var i = 0;
      while (i < str.length) {
        var _char = str[i];
        if (_char === "*" || _char === "+" || _char === "?") {
          tokens.push({
            type: "MODIFIER",
            index: i,
            value: str[i++]
          });
          continue;
        }
        if (_char === "\\") {
          tokens.push({
            type: "ESCAPED_CHAR",
            index: i++,
            value: str[i++]
          });
          continue;
        }
        if (_char === "{") {
          tokens.push({
            type: "OPEN",
            index: i,
            value: str[i++]
          });
          continue;
        }
        if (_char === "}") {
          tokens.push({
            type: "CLOSE",
            index: i,
            value: str[i++]
          });
          continue;
        }
        if (_char === ":") {
          var name = "";
          var j = i + 1;
          while (j < str.length) {
            var code = str.charCodeAt(j);
            if (code >= 48 && code <= 57 || code >= 65 && code <= 90 || code >= 97 && code <= 122 || code === 95) {
              name += str[j++];
              continue;
            }
            break;
          }
          if (!name) throw new TypeError("Missing parameter name at ".concat(i));
          tokens.push({
            type: "NAME",
            index: i,
            value: name
          });
          i = j;
          continue;
        }
        if (_char === "(") {
          var count = 1;
          var pattern = "";
          var j = i + 1;
          if (str[j] === "?") {
            throw new TypeError("Pattern cannot start with \"?\" at ".concat(j));
          }
          while (j < str.length) {
            if (str[j] === "\\") {
              pattern += str[j++] + str[j++];
              continue;
            }
            if (str[j] === ")") {
              count--;
              if (count === 0) {
                j++;
                break;
              }
            } else if (str[j] === "(") {
              count++;
              if (str[j + 1] !== "?") {
                throw new TypeError("Capturing groups are not allowed at ".concat(j));
              }
            }
            pattern += str[j++];
          }
          if (count) throw new TypeError("Unbalanced pattern at ".concat(i));
          if (!pattern) throw new TypeError("Missing pattern at ".concat(i));
          tokens.push({
            type: "PATTERN",
            index: i,
            value: pattern
          });
          i = j;
          continue;
        }
        tokens.push({
          type: "CHAR",
          index: i,
          value: str[i++]
        });
      }
      tokens.push({
        type: "END",
        index: i,
        value: ""
      });
      return tokens;
    }
    function parse(str, options) {
      if (options === void 0) {
        options = {};
      }
      var tokens = lexer(str);
      var _a = options.prefixes,
        prefixes = _a === void 0 ? "./" : _a,
        _b = options.delimiter,
        delimiter = _b === void 0 ? "/#?" : _b;
      var result = [];
      var key = 0;
      var i = 0;
      var path = "";
      var tryConsume = function tryConsume(type) {
        if (i < tokens.length && tokens[i].type === type) return tokens[i++].value;
      };
      var mustConsume = function mustConsume(type) {
        var value = tryConsume(type);
        if (value !== undefined) return value;
        var _a = tokens[i],
          nextType = _a.type,
          index = _a.index;
        throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
      };
      var consumeText = function consumeText() {
        var result = "";
        var value;
        while (value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
          result += value;
        }
        return result;
      };
      var isSafe = function isSafe(value) {
        for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
          var _char2 = delimiter_1[_i];
          if (value.indexOf(_char2) > -1) return true;
        }
        return false;
      };
      var safePattern = function safePattern(prefix) {
        var prev = result[result.length - 1];
        var prevText = prefix || (prev && typeof prev === "string" ? prev : "");
        if (prev && !prevText) {
          throw new TypeError("Must have text between two parameters, missing text after \"".concat(prev.name, "\""));
        }
        if (!prevText || isSafe(prevText)) return "[^".concat(escapeString(delimiter), "]+?");
        return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
      };
      while (i < tokens.length) {
        var _char3 = tryConsume("CHAR");
        var name = tryConsume("NAME");
        var pattern = tryConsume("PATTERN");
        if (name || pattern) {
          var prefix = _char3 || "";
          if (prefixes.indexOf(prefix) === -1) {
            path += prefix;
            prefix = "";
          }
          if (path) {
            result.push(path);
            path = "";
          }
          result.push({
            name: name || key++,
            prefix: prefix,
            suffix: "",
            pattern: pattern || safePattern(prefix),
            modifier: tryConsume("MODIFIER") || ""
          });
          continue;
        }
        var value = _char3 || tryConsume("ESCAPED_CHAR");
        if (value) {
          path += value;
          continue;
        }
        if (path) {
          result.push(path);
          path = "";
        }
        var open = tryConsume("OPEN");
        if (open) {
          var prefix = consumeText();
          var name_1 = tryConsume("NAME") || "";
          var pattern_1 = tryConsume("PATTERN") || "";
          var suffix = consumeText();
          mustConsume("CLOSE");
          result.push({
            name: name_1 || (pattern_1 ? key++ : ""),
            pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
            prefix: prefix,
            suffix: suffix,
            modifier: tryConsume("MODIFIER") || ""
          });
          continue;
        }
        mustConsume("END");
      }
      return result;
    }
    function match(str, options) {
      var keys = [];
      var re = pathToRegexp(str, keys, options);
      return regexpToFunction(re, keys, options);
    }
    function regexpToFunction(re, keys, options) {
      if (options === void 0) {
        options = {};
      }
      var _a = options.decode,
        decode = _a === void 0 ? function (x) {
          return x;
        } : _a;
      return function (pathname) {
        var m = re.exec(pathname);
        if (!m) return false;
        var path = m[0],
          index = m.index;
        var params = Object.create(null);
        var _loop_1 = function _loop_1(i) {
          if (m[i] === undefined) return "continue";
          var key = keys[i - 1];
          if (key.modifier === "*" || key.modifier === "+") {
            params[key.name] = m[i].split(key.prefix + key.suffix).map(function (value) {
              return decode(value, key);
            });
          } else {
            params[key.name] = decode(m[i], key);
          }
        };
        for (var i = 1; i < m.length; i++) {
          _loop_1(i);
        }
        return {
          path: path,
          index: index,
          params: params
        };
      };
    }
    function escapeString(str) {
      return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
    }
    function flags(options) {
      return options && options.sensitive ? "" : "i";
    }
    function regexpToRegexp(path, keys) {
      if (!keys) return path;
      var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
      var index = 0;
      var execResult = groupsRegex.exec(path.source);
      while (execResult) {
        keys.push({
          name: execResult[1] || index++,
          prefix: "",
          suffix: "",
          modifier: "",
          pattern: ""
        });
        execResult = groupsRegex.exec(path.source);
      }
      return path;
    }
    function arrayToRegexp(paths, keys, options) {
      var parts = paths.map(function (path) {
        return pathToRegexp(path, keys, options).source;
      });
      return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
    }
    function stringToRegexp(path, keys, options) {
      return tokensToRegexp(parse(path, options), keys, options);
    }
    function tokensToRegexp(tokens, keys, options) {
      if (options === void 0) {
        options = {};
      }
      var _a = options.strict,
        strict = _a === void 0 ? false : _a,
        _b = options.start,
        start = _b === void 0 ? true : _b,
        _c = options.end,
        end = _c === void 0 ? true : _c,
        _d = options.encode,
        encode = _d === void 0 ? function (x) {
          return x;
        } : _d,
        _e = options.delimiter,
        delimiter = _e === void 0 ? "/#?" : _e,
        _f = options.endsWith,
        endsWith = _f === void 0 ? "" : _f;
      var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
      var delimiterRe = "[".concat(escapeString(delimiter), "]");
      var route = start ? "^" : "";
      for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
        var token = tokens_1[_i];
        if (typeof token === "string") {
          route += escapeString(encode(token));
        } else {
          var prefix = escapeString(encode(token.prefix));
          var suffix = escapeString(encode(token.suffix));
          if (token.pattern) {
            if (keys) keys.push(token);
            if (prefix || suffix) {
              if (token.modifier === "+" || token.modifier === "*") {
                var mod = token.modifier === "*" ? "?" : "";
                route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
              } else {
                route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
              }
            } else {
              if (token.modifier === "+" || token.modifier === "*") {
                throw new TypeError("Can not repeat \"".concat(token.name, "\" without a prefix and suffix"));
              }
              route += "(".concat(token.pattern, ")").concat(token.modifier);
            }
          } else {
            route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
          }
        }
      }
      if (end) {
        if (!strict) route += "".concat(delimiterRe, "?");
        route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
      } else {
        var endToken = tokens[tokens.length - 1];
        var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === undefined;
        if (!strict) {
          route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
        }
        if (!isEndDelimited) {
          route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
        }
      }
      return new RegExp(route, flags(options));
    }
    function pathToRegexp(path, keys, options) {
      if (path instanceof RegExp) return regexpToRegexp(path, keys);
      if (Array.isArray(path)) return arrayToRegexp(path, keys, options);
      return stringToRegexp(path, keys, options);
    }

    function decode(val) {
      try {
        return decodeURIComponent(val);
      } catch (_unused) {
        return val;
      }
    }
    function matchRoute(route, baseUrl, options, pathname, parentParams) {
      var matchResult;
      var childMatches;
      var childIndex = 0;
      return {
        next: function next(routeToSkip) {
          if (route === routeToSkip) {
            return {
              done: true,
              value: false
            };
          }
          if (!matchResult) {
            var rt = route;
            var end = !rt.children;
            if (!rt.match) {
              rt.match = match(rt.path || '', Object.assign({
                end: end
              }, options));
            }
            matchResult = rt.match(pathname);
            if (matchResult) {
              var _matchResult = matchResult,
                path = _matchResult.path;
              matchResult.path = !end && path.charAt(path.length - 1) === '/' ? path.substr(1) : path;
              matchResult.params = Object.assign({}, parentParams, matchResult.params);
              return {
                done: false,
                value: {
                  route: route,
                  baseUrl: baseUrl,
                  path: matchResult.path,
                  params: matchResult.params
                }
              };
            }
          }
          if (matchResult && route.children) {
            while (childIndex < route.children.length) {
              if (!childMatches) {
                var childRoute = route.children[childIndex];
                childRoute.parent = route;
                childMatches = matchRoute(childRoute, baseUrl + matchResult.path, options, pathname.substr(matchResult.path.length), matchResult.params);
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
            done: true,
            value: false
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
    var UniversalRouter = function () {
      function UniversalRouter(routes, options) {
        if (!routes || typeof routes !== 'object') {
          throw new TypeError('Invalid routes');
        }
        this.options = Object.assign({
          decode: decode
        }, options);
        this.baseUrl = this.options.baseUrl || '';
        this.root = Array.isArray(routes) ? {
          path: '',
          children: routes,
          parent: null
        } : routes;
        this.root.parent = null;
      }
      var _proto = UniversalRouter.prototype;
      _proto.resolve = function resolve(pathnameOrContext) {
        var _this = this;
        var context = Object.assign({
          router: this
        }, this.options.context, typeof pathnameOrContext === 'string' ? {
          pathname: pathnameOrContext
        } : pathnameOrContext);
        var matchResult = matchRoute(this.root, this.baseUrl, this.options, context.pathname.substr(this.baseUrl.length));
        var resolve = this.options.resolveRoute || resolveRoute;
        var matches;
        var nextMatches;
        var currentContext = context;
        function next(resume, parent, prevResult) {
          if (parent === void 0) {
            parent = !matches.done && matches.value.route;
          }
          var routeToSkip = prevResult === null && !matches.done && matches.value.route;
          matches = nextMatches || matchResult.next(routeToSkip);
          nextMatches = null;
          if (!resume) {
            if (matches.done || !isChildRoute(parent, matches.value.route)) {
              nextMatches = matches;
              return Promise.resolve(null);
            }
          }
          if (matches.done) {
            var _error = new Error('Route not found');
            _error.status = 404;
            return Promise.reject(_error);
          }
          currentContext = Object.assign({}, context, matches.value);
          return Promise.resolve(resolve(currentContext, matches.value.params)).then(function (result) {
            if (result !== null && result !== undefined) {
              return result;
            }
            return next(resume, parent, result);
          });
        }
        context['next'] = next;
        return Promise.resolve().then(function () {
          return next(true, _this.root);
        })["catch"](function (error) {
          if (_this.options.errorHandler) {
            return _this.options.errorHandler(error, currentContext);
          }
          throw error;
        });
      };
      return UniversalRouter;
    }();

    return UniversalRouter;

}));
//# sourceMappingURL=universal-router.js.map
