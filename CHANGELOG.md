# Universal Router Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [9.0.1] - 2020-03-11

- Fix typings: `router.resolve()` and `context.next()` always return a promise now
  ([#187](https://github.com/kriasoft/universal-router/pull/187))

## [9.0.0] - 2020-02-27

- Update [path-to-regexp](https://github.com/pillarjs/path-to-regexp) from v3 to v6, see
  [changelog](https://github.com/pillarjs/path-to-regexp/releases)
  (BREAKING CHANGE)
- Remove `context.keys` (BREAKING CHANGE)
- Migrate to [TypeScript](https://www.typescriptlang.org/)
  ([#183](https://github.com/kriasoft/universal-router/pull/183))

## [8.3.0] - 2019-09-17

- Make `generateUrls` compatible with `UniversalRouterSync`
  ([#172](https://github.com/kriasoft/universal-router/pull/172))

## [8.2.1] - 2019-07-20

- Fix `context.next()` to throw `Route not found` instead of `TypeError`
  ([#169](https://github.com/kriasoft/universal-router/pull/169))

## [8.2.0] - 2019-05-10

- Improve TypeScript typings ([#167](https://github.com/kriasoft/universal-router/pull/167))

## [8.1.0] - 2019-02-20

- Add [synchronous mode](https://github.com/kriasoft/universal-router/blob/v8.1.0/docs/api.md#synchronous-mode)
  as an add-on ([#164](https://github.com/kriasoft/universal-router/pull/164))

## [8.0.0] - 2019-01-15

- Update [path-to-regexp](https://github.com/pillarjs/path-to-regexp) from v2.4.0 to v3.0.0, see
  [changelog](https://github.com/pillarjs/path-to-regexp/blob/4eee1e15ba72d93c996bac4ae649a846eb326562/History.md#300--2019-01-13)
  (BREAKING CHANGE [#161](https://github.com/kriasoft/universal-router/pull/161))
- Add [TypeScript](https://www.typescriptlang.org/) typings
  ([#159](https://github.com/kriasoft/universal-router/pull/159))

## [7.0.0] - 2018-10-11

- The router no longer mutate errors to avoid issues with non-extensible objects.
  (BREAKING CHANGE [#158](https://github.com/kriasoft/universal-router/pull/158)).

**Migration from v6 to v7:**

- If your code relies on `error.context` or `error.code` you still can access them
  using `errorHandler` option:
  ```js
  errorHandler(error, context) {
    const code = error.status || 500
    console.log(error, context, code)
  }
  ```

## [6.0.0] - 2018-02-06

- No special configuration is required for your bundler anymore (say hi to [parcel.js](https://parceljs.org/)).
- Add an option for global error handling ([#147](https://github.com/kriasoft/universal-router/pull/147)).

**Migration from v5 to v6:**

- Use `error.code` instead of `error.status` or `error.statusCode` for error handling.

## [5.1.0] - 2018-01-16

- Allow any string to be a valid route name ([#145](https://github.com/kriasoft/universal-router/pull/145))

## [5.0.0] - 2017-10-30

- Skip nested routes when a middleware route returns `null`
  (BREAKING CHANGE [#140](https://github.com/kriasoft/universal-router/pull/140))

**Migration from v4 to v5:**

- If you are using `resolveRoute` option for custom route handling logic then you need
  to return `undefined` instead of `null` in cases when a route should not match
- Make sure that your middleware routes which return `null` are working as you expect,
  child routes are no longer executed in this case

## [4.3.0] - 2017-10-22

- Update [path-to-regexp](https://github.com/pillarjs/path-to-regexp) from v2.0.0 to v2.1.0, see
  [changelog](https://github.com/pillarjs/path-to-regexp/blob/b0b9a92663059d7a7d40d81fa811f0d31e2ba877/History.md#210--2017-10-20)
  ([#137](https://github.com/kriasoft/universal-router/pull/137))

## [4.2.1] - 2017-10-06

- Fix order of `context.keys` when they preserved from parent routes
  (i.e. keys order is the same as they appear in a url)
  ([#129](https://github.com/kriasoft/universal-router/pull/129))

## [4.2.0] - 2017-09-20

- Correctly handle trailing slashes in paths of routes
  ([#124](https://github.com/kriasoft/universal-router/pull/124))<br>
  If you are using trailing slashes in your paths, then the router will match urls only with trailing slashes:
  ```js
  const routes = [
    { path: '/posts', ... },  // matches both "/posts" and "/posts/"
    { path: '/posts/', ... }, // matches only "/posts/"
  ]
  ```
- Generate url from first path for routes with an array of paths
  ([#124](https://github.com/kriasoft/universal-router/pull/124))
  ```js
  const router = new UniversalRouter({
    name: 'page',
    path: ['/one', '/two', /RegExp/], // only first path is used for url generation
  })
  const url = generateUrls(router)
  url('page') // => /one
  ```

## [4.1.0] - 2017-09-20

- Support for using the same param name in array of paths ([#122](https://github.com/kriasoft/universal-router/pull/122))

  ```js
  const router = new UniversalRouter({
    path: ['/one/:parameter', '/two/:parameter'],
    action: context => context.params,
  })

  router.resolve('/one/a') // => { parameter: 'a' }
  router.resolve('/two/b') // => { parameter: 'b' }
  ```

## [4.0.0] - 2017-09-15

- Rename `router.resolve({ path })` to `router.resolve({ pathname })`
  (BREAKING CHANGE [#114](https://github.com/kriasoft/universal-router/pull/114))
- Rename `context.url` to `context.pathname`
  (BREAKING CHANGE [#114](https://github.com/kriasoft/universal-router/pull/114))
- Remove `pretty` option from `generateUrls(router, options)` function in favor of new `encode` option
  (BREAKING CHANGE [#111](https://github.com/kriasoft/universal-router/pull/111))
- Update [path-to-regexp](https://github.com/pillarjs/path-to-regexp) to v2.0.0, see
  [changelog](https://github.com/pillarjs/path-to-regexp/blob/1bf805251c8486ea44395cd12afc37f77deec95e/History.md#200--2017-08-23)
  (BREAKING CHANGE [#111](https://github.com/kriasoft/universal-router/pull/111))
  - Explicitly handle trailing delimiters (e.g. `/test/` is now treated as `/test/` instead of `/test` when matching)
  - No wildcard asterisk (`*`) - use parameters instead (`(.*)`)
- Add support for repeat parameters ([#116](https://github.com/kriasoft/universal-router/pull/116))
- Add `encode` option to `generateUrls(router, options)` function for pretty encoding
  (e.g. pass your own implementation) ([#111](https://github.com/kriasoft/universal-router/pull/111))
- Preserve `context.keys` values from the parent route ([#111](https://github.com/kriasoft/universal-router/pull/111))
- Inherit `context.params` and `queryParams` from
  [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
  (e.g. `params.hasOwnProperty()` won't throw an exception anymore)
  ([#111](https://github.com/kriasoft/universal-router/pull/111))
- Include the source code of the router in the [npm package](https://www.npmjs.com/package/universal-router)
  ([#110](https://github.com/kriasoft/universal-router/pull/110))

**Migration from v3 to v4:**

- Change `router.resolve({ path, ... })` to `router.resolve({ pathname, ... })`
- Remove trailing slashes from all paths of your routes, i.e.
  - `path: '/posts/:uri/'` => `path: '/posts/:uri'`
  - `path: '/posts/'` => `path: '/posts'`
  - `path: '/'` => `path: ''`
  - etc.
- Replace `path: '*'` with `path: '(.*)'` if any
- If you are using webpack, change [rule](https://webpack.js.org/configuration/module/#rule) (loader)
  for `.js` files to include `.mjs` extension, i.e.
  - `test: /\.js$/` => `test: /\.m?js$/`

## [3.2.0] - 2017-05-10

- Add `stringifyQueryParams` option to `generateUrls(router, options)` to generate URL with
  [query string](http://en.wikipedia.org/wiki/Query_string) from unknown route params
  ([#93](https://github.com/kriasoft/universal-router/pull/93))

## [3.1.0] - 2017-04-20

- Fix `context.next()` for multiple nested routes
  ([#91](https://github.com/kriasoft/universal-router/pull/91))
- Add `pretty` option for `generateUrls(router, options)` to prettier encoding of URI path segments
  ([#88](https://github.com/kriasoft/universal-router/pull/88))
- Add source maps for minified builds ([#87](https://github.com/kriasoft/universal-router/pull/87))
- Include UMD builds to the git repository

## [3.0.0] - 2017-03-25

- Update Router API (BREAKING CHANGE)

  ```js
  import Router from 'universal-router'
  const router = new Router(routes, options)
  router.resolve({ path, ...context }) // => Promise<any>

  // previously
  import { resolve } from 'universal-router'
  resolve(routes, { path, ...context }) // => Promise<any>
  ```

  See [#83](https://github.com/kriasoft/universal-router/pull/83) for more info and examples

- `context.next()` now iterates only child routes by default (BREAKING CHANGE)<br>
  use `context.next(true)` to iterate through the all remaining routes
- Remove `babel-runtime` dependency to decrease library size (BREAKING CHANGE)<br>
  Now you need to care about these polyfills yourself:
  - [Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  - [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
  - [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
- Add support for URL Generation
  ```js
  import generateUrls from 'universal-router/generate-urls'
  const url = generateUrls(router)
  url(routeName, params) // => String
  ```
- Add support for Dynamic Breadcrumbs, use `context.route.parent` to iterate
- Add support for Declarative Routes, `new Router(routes, { resolveRoute: customResolveRouteFn })`
- Add support for Base URL option, `new Router(routes, { baseUrl: '/base' })`
- Add ability to specify custom context properties once, `new Router(routes, { context: { ... } })`
- Rewrite `matchRoute` function without usage of
  [generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*)
  to decrease amount of necessary polyfills
- Remove usage of
  [String.prototype.startsWith()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith)
- Add `context.url` with the original url passed to `resolve` method
- Add `context` property to `Route not found` error

## [2.0.0] - 2016-10-20

- Preserve `context.params` values from the parent route ([#57](https://github.com/kriasoft/universal-router/pull/57))
- Throws an error if no route found ([#62](https://github.com/kriasoft/universal-router/pull/62))
- Remove obsolete `context.end()` method ([#60](https://github.com/kriasoft/universal-router/pull/60))
- Remove obsolete `match` alias for `resolve` function ([#59](https://github.com/kriasoft/universal-router/pull/59))
- Do not throw an error for malformed URI params ([#54](https://github.com/kriasoft/universal-router/pull/54))
- Handle `null` the same way as `undefined` ([#51](https://github.com/kriasoft/universal-router/pull/51))
- Return `null` instead of `undefined` to signal no match ([#51](https://github.com/kriasoft/universal-router/pull/51))
- Support `context.next()` across multiple routes ([#49](https://github.com/kriasoft/universal-router/pull/49))
- Sequential execution of asynchronous routes ([#49](https://github.com/kriasoft/universal-router/pull/49))
- Remove errors handler from core ([#48](https://github.com/kriasoft/universal-router/pull/48))
- Drop support of node.js v5 and below ([#47](https://github.com/kriasoft/universal-router/pull/47))

## [1.2.2] - 2016-05-31

- Update UMD build to include missing dependencies ([#33](https://github.com/kriasoft/universal-router/pull/33))

## [1.2.1] - 2016-05-12

- Rename `match()` to `resolve()`. E.g. `import { resovle } from 'universal-router'`
- Fix an issue when the router throws an exception when the top-level route doesn't have `children` property
- Include CommonJS, Harmony Modules, ES5.1 and UMD builds into NPM package
- Include source maps into NPM package

## [1.1.0-beta.4] - 2016-04-27

- Fix optional parameters, e.g. `/products/:id?` ([#27](https://github.com/kriasoft/universal-router/pull/27))

## [1.1.0-beta.3] - 2016-04-08

- Fix `matchRoute()` yielding the same route twice when it matches to both full and base URLs

## [1.1.0-beta.2] - 2016-04-08

- `match(routes, { path, ...context)` now throws an error if a matching route was not found (BREAKING CHANGE)
- If there is a top-level route with path equal to `/error`, it will be used for error handling by convention

## [1.1.0-beta.1] - 2016-04-05

- Remove `Router` class and `router.dispatch()` method in favor of
  `match(routes, { path, ...context })`, where `routes` is just a plain JavaScript objects containing
  the list of routes (BREAKING CHANGE)
- Add `context.end()` method to be used from inside route actions
- Update documentation and code samples

## [1.0.0-beta.1] - 2016-03-25

- Rename `react-routing` to `universal-router` (BREAKING CHANGE)
- Remove `router.on(path, ...actions)` in favor of `router.route(path, ...actions)` (BREAKING CHANGE)
- Remove `new Router(on => { ... })` initialization option in favor of `new Router(routes)` (BREAKING CHANGE)
- Fix ESLint warnings
- Update unit tests
- Remove build tools related to project's homepage in favor of [Easystatic](https://easystatic.com)
- Refactor project's homepage layout. See `docs/assets`.
- Clean up `package.json`, update Babel and its plug-ins to the latest versions
- Make the library use `babel-runtime` package instead of an inline runtime
- Add [CHANGELOG.md](CHANGELOG.md) file with the notable changes to this project

## [0.0.7] - 2015-12-13

- Small bug fixes and improvements

[unreleased]: https://github.com/kriasoft/universal-router/compare/v9.0.1...HEAD
[9.0.1]: https://github.com/kriasoft/universal-router/compare/v9.0.0...v9.0.1
[9.0.0]: https://github.com/kriasoft/universal-router/compare/v8.3.0...v9.0.0
[8.3.0]: https://github.com/kriasoft/universal-router/compare/v8.2.1...v8.3.0
[8.2.1]: https://github.com/kriasoft/universal-router/compare/v8.2.0...v8.2.1
[8.2.0]: https://github.com/kriasoft/universal-router/compare/v8.1.0...v8.2.0
[8.1.0]: https://github.com/kriasoft/universal-router/compare/v8.0.0...v8.1.0
[8.0.0]: https://github.com/kriasoft/universal-router/compare/v7.0.0...v8.0.0
[7.0.0]: https://github.com/kriasoft/universal-router/compare/v6.0.0...v7.0.0
[6.0.0]: https://github.com/kriasoft/universal-router/compare/v5.1.0...v6.0.0
[5.1.0]: https://github.com/kriasoft/universal-router/compare/v5.0.0...v5.1.0
[5.0.0]: https://github.com/kriasoft/universal-router/compare/v4.3.0...v5.0.0
[4.3.0]: https://github.com/kriasoft/universal-router/compare/v4.2.1...v4.3.0
[4.2.1]: https://github.com/kriasoft/universal-router/compare/v4.2.0...v4.2.1
[4.2.0]: https://github.com/kriasoft/universal-router/compare/v4.1.0...v4.2.0
[4.1.0]: https://github.com/kriasoft/universal-router/compare/v4.0.0...v4.1.0
[4.0.0]: https://github.com/kriasoft/universal-router/compare/v3.2.0...v4.0.0
[3.2.0]: https://github.com/kriasoft/universal-router/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/kriasoft/universal-router/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/kriasoft/universal-router/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/kriasoft/universal-router/compare/v1.2.2...v2.0.0
[1.2.2]: https://github.com/kriasoft/universal-router/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/kriasoft/universal-router/compare/v1.1.0-beta.4...v1.2.1
[1.1.0-beta.4]: https://github.com/kriasoft/universal-router/compare/v1.1.0-beta.3...v1.1.0-beta.4
[1.1.0-beta.3]: https://github.com/kriasoft/universal-router/compare/v1.1.0-beta.2...v1.1.0-beta.3
[1.1.0-beta.2]: https://github.com/kriasoft/universal-router/compare/v1.1.0-beta.1...v1.1.0-beta.2
[1.1.0-beta.1]: https://github.com/kriasoft/universal-router/compare/v1.0.0-beta.1...v1.1.0-beta.1
[1.0.0-beta.1]: https://github.com/kriasoft/universal-router/compare/v0.0.7...v1.0.0-beta.1
[0.0.7]: https://github.com/kriasoft/universal-router/compare/v0.0.6...v0.0.7
