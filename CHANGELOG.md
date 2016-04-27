## Universal Router Change Log

All notable changes to this project will be documented in this file.

### [Unreleased][unreleased]

- Add `context.redirect(path)` method to be used from inside route actions (PLANNED)

### [v1.1.0-beta.4] - 2016-04-27

- Fix optional parameters, e.g. `/products/:id?` ([#27](https://github.com/kriasoft/universal-router/pull/27))

### [v1.1.0-beta.3] - 2016-04-08

- Fix `matchRoute()` yielding the same route twice when it matches to both full and base URLs

### [v1.1.0-beta.2] - 2016-04-08

- `match(routes, { path, ...context)` now throws an error if a matching route was not found (BREAKING CHANGE)
- If there is a top-level route with path equal to `/error`, it will be used for error handling by convention

### [v1.1.0-beta.1] - 2016-04-05

- Remove `Router` class and `router.dispatch()` method in favor of
 `match(routes, { path, ...context })`, where `routes` is just a plain JavaScript objects containing
 the list of routes (BREAKING CHANGE)
- Add `context.end()` method to be used from inside route actions
- Update documentation and code samples

### [v1.0.0-beta.1] - 2016-03-25

- Rename `react-routing` to `universal-router` (BREAKING CHANGE)
- Remove `router.on(path, ...actions)` in favor of `router.route(path, ...actions)` (BREAKING CHANGE)
- Remove `new Router(on => { ... })` initialization option in favor of `new Router(routes)` (BREAKING CHANGE)
- Fix ESLint warnings; update unit tests
- Remove build tools related to project's homepage in favor of [Easystatic](https://easystatic.com)
- Refactor project's homepage layout. See `docs/assets`.
- Clean up `package.json`, update Babel and its plug-ins to the latest versions
- Make the library use `babel-runtime` package instead of an inline runtime
- Add [CHANGELOG.md](CHANGELOG.md) file with the notable changes to this project

### [v0.0.7] - 2015-12-13

- Small bug fixes and improvements

[unreleased]: https://github.com/kriasoft/react-starter-kit/compare/v1.1.0-beta.4...HEAD
[v1.1.0-beta.4]: https://github.com/kriasoft/react-starter-kit/compare/v1.1.0-beta.3...v1.1.0-beta.4
[v1.1.0-beta.3]: https://github.com/kriasoft/react-starter-kit/compare/v1.1.0-beta.2...v1.1.0-beta.3
[v1.1.0-beta.2]: https://github.com/kriasoft/react-starter-kit/compare/v1.1.0-beta.1...v1.1.0-beta.2
[v1.1.0-beta.1]: https://github.com/kriasoft/react-starter-kit/compare/v1.0.0-beta.1...v1.1.0-beta.1
[v1.0.0-beta.1]: https://github.com/kriasoft/react-starter-kit/compare/v0.0.7...v1.0.0-beta.1
[v0.0.7]: https://github.com/kriasoft/react-starter-kit/compare/v0.0.6...v0.0.7
