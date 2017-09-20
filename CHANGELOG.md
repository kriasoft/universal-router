# Universal Router Change Log

All notable changes to this project will be documented in this file.

## [Unreleased][unreleased]

- Correctly handle trailing slashes in paths of routes
  ([#124](https://github.com/kriasoft/universal-router/pull/124))<br>
  If you are using trailing slashes in your paths, then the router will match urls only with trailing slashes:
  ```js
  const routes = [
    { path: '/posts', ... },  // matches both "/posts" and "/posts/"
    { path: '/posts/', ... }, // matches only "/posts/"
  ];
  ```
- Generate url from first path for routes with an array of paths
  ([#124](https://github.com/kriasoft/universal-router/pull/124))
  ```js
  const router = new UniversalRouter({
    name: 'page',
    path: ['/one', '/two', /RegExp/], // only first path is used for url generation
  });
  const url = generateUrls(router);
  url('page'); // => /one
  ```

## [v4.1.0] - 2017-09-20

- Support for using the same param name in array of paths ([#122](https://github.com/kriasoft/universal-router/pull/122))

## [v4.0.0] - 2017-09-15

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

## [v3.2.0] - 2017-05-10

- Add `stringifyQueryParams` option to `generateUrls(router, options)` to generate URL with
  [query string](http://en.wikipedia.org/wiki/Query_string) from unknown route params
  ([#93](https://github.com/kriasoft/universal-router/pull/93))

## [v3.1.0] - 2017-04-20

- Fix `context.next()` for multiple nested routes
  ([#91](https://github.com/kriasoft/universal-router/pull/91))
- Add `pretty` option for `generateUrls(router, options)` to prettier encoding of URI path segments
  ([#88](https://github.com/kriasoft/universal-router/pull/88))
- Add source maps for minified builds ([#87](https://github.com/kriasoft/universal-router/pull/87))
- Include UMD builds to the git repository

## [v3.0.0] - 2017-03-25

- Update Router API (BREAKING CHANGE)
  ```js
  import Router from 'universal-router';
  const router = new Router(routes, options);
  router.resolve({ path, ...context }); // => Promise<any>

  // previously
  import { resolve } from 'universal-router';
  resolve(routes, { path, ...context }); // => Promise<any>
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
  import generateUrls from 'universal-router/generate-urls';
  const url = generateUrls(router);
  url(routeName, params); // => String
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

## [v2.0.0] - 2016-10-20

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

## [v1.2.2] - 2016-05-31

- Update UMD build to include missing dependencies ([#33](https://github.com/kriasoft/universal-router/pull/33))

## [v1.2.1] - 2016-05-12

- Rename `match()` to `resolve()`. E.g. `import { resovle } from 'universal-router'`
- Fix an issue when the router throws an exception when the top-level route doesn't have `children` property
- Include CommonJS, Harmony Modules, ES5.1 and UMD builds into NPM package
- Include source maps into NPM package

## [v1.1.0-beta.4] - 2016-04-27

- Fix optional parameters, e.g. `/products/:id?` ([#27](https://github.com/kriasoft/universal-router/pull/27))

## [v1.1.0-beta.3] - 2016-04-08

- Fix `matchRoute()` yielding the same route twice when it matches to both full and base URLs

## [v1.1.0-beta.2] - 2016-04-08

- `match(routes, { path, ...context)` now throws an error if a matching route was not found (BREAKING CHANGE)
- If there is a top-level route with path equal to `/error`, it will be used for error handling by convention

## [v1.1.0-beta.1] - 2016-04-05

- Remove `Router` class and `router.dispatch()` method in favor of
 `match(routes, { path, ...context })`, where `routes` is just a plain JavaScript objects containing
 the list of routes (BREAKING CHANGE)
- Add `context.end()` method to be used from inside route actions
- Update documentation and code samples

## [v1.0.0-beta.1] - 2016-03-25

- Rename `react-routing` to `universal-router` (BREAKING CHANGE)
- Remove `router.on(path, ...actions)` in favor of `router.route(path, ...actions)` (BREAKING CHANGE)
- Remove `new Router(on => { ... })` initialization option in favor of `new Router(routes)` (BREAKING CHANGE)
- Fix ESLint warnings; update unit tests
- Remove build tools related to project's homepage in favor of [Easystatic](https://easystatic.com)
- Refactor project's homepage layout. See `docs/assets`.
- Clean up `package.json`, update Babel and its plug-ins to the latest versions
- Make the library use `babel-runtime` package instead of an inline runtime
- Add [CHANGELOG.md](CHANGELOG.md) file with the notable changes to this project

## [v0.0.7] - 2015-12-13

- Small bug fixes and improvements

[unreleased]: https://github.com/kriasoft/universal-router/compare/v4.1.0...HEAD
[v4.1.0]: https://github.com/kriasoft/universal-router/compare/v4.0.0...v4.1.0
[v4.0.0]: https://github.com/kriasoft/universal-router/compare/v3.2.0...v4.0.0
[v3.2.0]: https://github.com/kriasoft/universal-router/compare/v3.1.0...v3.2.0
[v3.1.0]: https://github.com/kriasoft/universal-router/compare/v3.0.0...v3.1.0
[v3.0.0]: https://github.com/kriasoft/universal-router/compare/v2.0.0...v3.0.0
[v2.0.0]: https://github.com/kriasoft/universal-router/compare/v1.2.2...v2.0.0
[v1.2.2]: https://github.com/kriasoft/universal-router/compare/v1.2.1...v1.2.2
[v1.2.1]: https://github.com/kriasoft/universal-router/compare/v1.1.0-beta.4...v1.2.1
[v1.1.0-beta.4]: https://github.com/kriasoft/universal-router/compare/v1.1.0-beta.3...v1.1.0-beta.4
[v1.1.0-beta.3]: https://github.com/kriasoft/universal-router/compare/v1.1.0-beta.2...v1.1.0-beta.3
[v1.1.0-beta.2]: https://github.com/kriasoft/universal-router/compare/v1.1.0-beta.1...v1.1.0-beta.2
[v1.1.0-beta.1]: https://github.com/kriasoft/universal-router/compare/v1.0.0-beta.1...v1.1.0-beta.1
[v1.0.0-beta.1]: https://github.com/kriasoft/universal-router/compare/v0.0.7...v1.0.0-beta.1
[v0.0.7]: https://github.com/kriasoft/universal-router/compare/v0.0.6...v0.0.7
