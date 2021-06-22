/*! Universal Router | MIT License | https://www.kriasoft.com/universal-router/ */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.generateUrls = factory());
}(this, (function () { 'use strict';

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

          if (!name) throw new TypeError("Missing parameter name at " + i);
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
            throw new TypeError("Pattern cannot start with \"?\" at " + j);
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
                throw new TypeError("Capturing groups are not allowed at " + j);
              }
            }

            pattern += str[j++];
          }

          if (count) throw new TypeError("Unbalanced pattern at " + i);
          if (!pattern) throw new TypeError("Missing pattern at " + i);
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
          prefixes = _a === void 0 ? "./" : _a;
      var defaultPattern = "[^" + escapeString(options.delimiter || "/#?") + "]+?";
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
        throw new TypeError("Unexpected " + nextType + " at " + index + ", expected " + type);
      };

      var consumeText = function consumeText() {
        var result = "";
        var value;

        while (value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
          result += value;
        }

        return result;
      };

      while (i < tokens.length) {
        var _char2 = tryConsume("CHAR");

        var name = tryConsume("NAME");
        var pattern = tryConsume("PATTERN");

        if (name || pattern) {
          var prefix = _char2 || "";

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
            pattern: pattern || defaultPattern,
            modifier: tryConsume("MODIFIER") || ""
          });
          continue;
        }

        var value = _char2 || tryConsume("ESCAPED_CHAR");

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
            pattern: name_1 && !pattern_1 ? defaultPattern : pattern_1,
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
    function tokensToFunction(tokens, options) {
      if (options === void 0) {
        options = {};
      }

      var reFlags = flags(options);
      var _a = options.encode,
          encode = _a === void 0 ? function (x) {
        return x;
      } : _a,
          _b = options.validate,
          validate = _b === void 0 ? true : _b;
      var matches = tokens.map(function (token) {
        if (typeof token === "object") {
          return new RegExp("^(?:" + token.pattern + ")$", reFlags);
        }
      });
      return function (data) {
        var path = "";

        for (var i = 0; i < tokens.length; i++) {
          var token = tokens[i];

          if (typeof token === "string") {
            path += token;
            continue;
          }

          var value = data ? data[token.name] : undefined;
          var optional = token.modifier === "?" || token.modifier === "*";
          var repeat = token.modifier === "*" || token.modifier === "+";

          if (Array.isArray(value)) {
            if (!repeat) {
              throw new TypeError("Expected \"" + token.name + "\" to not repeat, but got an array");
            }

            if (value.length === 0) {
              if (optional) continue;
              throw new TypeError("Expected \"" + token.name + "\" to not be empty");
            }

            for (var j = 0; j < value.length; j++) {
              var segment = encode(value[j], token);

              if (validate && !matches[i].test(segment)) {
                throw new TypeError("Expected all \"" + token.name + "\" to match \"" + token.pattern + "\", but got \"" + segment + "\"");
              }

              path += token.prefix + segment + token.suffix;
            }

            continue;
          }

          if (typeof value === "string" || typeof value === "number") {
            var segment = encode(String(value), token);

            if (validate && !matches[i].test(segment)) {
              throw new TypeError("Expected \"" + token.name + "\" to match \"" + token.pattern + "\", but got \"" + segment + "\"");
            }

            path += token.prefix + segment + token.suffix;
            continue;
          }

          if (optional) continue;
          var typeOfMessage = repeat ? "an array" : "a string";
          throw new TypeError("Expected \"" + token.name + "\" to be " + typeOfMessage);
        }

        return path;
      };
    }

    function escapeString(str) {
      return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
    }

    function flags(options) {
      return options && options.sensitive ? "" : "i";
    }

    function cacheRoutes(routesByName, route, routes, name, sep) {
      if (route.name && name && routesByName.has(name)) {
        throw new Error("Route \"" + name + "\" already exists");
      }

      if (route.name && name) {
        routesByName.set(name, route);
      }

      if (routes) {
        for (var i = 0; i < routes.length; i++) {
          var childRoute = routes[i];
          var childName = childRoute.name;
          childRoute.parent = route;
          cacheRoutes(routesByName, childRoute, childRoute.children, name && sep ? childName ? name + sep + childName : name : childName, sep);
        }
      }
    }

    function generateUrls(router, options) {
      if (!router) {
        throw new ReferenceError('Router is not defined');
      }

      var routesByName = new Map();
      var regexpByRoute = new Map();
      var opts = Object.assign({
        encode: encodeURIComponent
      }, options);
      return function (routeName, params) {
        var route = routesByName.get(routeName);

        if (!route) {
          routesByName.clear();
          regexpByRoute.clear();
          cacheRoutes(routesByName, router.root, router.root.children, router.root.name, opts.uniqueRouteNameSep);
          route = routesByName.get(routeName);

          if (!route) {
            throw new Error("Route \"" + routeName + "\" not found");
          }
        }

        var regexp = regexpByRoute.get(route);

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

          var tokens = parse(fullPath, opts);
          var toPath = tokensToFunction(tokens, opts);
          var keys = Object.create(null);

          for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];

            if (typeof token !== 'string') {
              keys[token.name] = true;
            }
          }

          regexp = {
            toPath: toPath,
            keys: keys
          };
          regexpByRoute.set(route, regexp);
        }

        var url = router.baseUrl + regexp.toPath(params) || '/';

        if (opts.stringifyQueryParams && params) {
          var queryParams = {};

          var _keys = Object.keys(params);

          for (var _i = 0; _i < _keys.length; _i++) {
            var key = _keys[_i];

            if (!regexp.keys[key]) {
              queryParams[key] = params[key];
            }
          }

          var query = opts.stringifyQueryParams(queryParams);

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
