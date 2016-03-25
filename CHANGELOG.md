## Universal Router Change Log

All notable changes to this project will be documented in this file.

### [Unreleased][unreleased]

- Add `router.use(middleware)` method (PLANNED)
- Add `router.redirect(from, to)` method (PLANNED)
- Add `context.redirect(path)` method to be used from inside route actions (PLANNED)
- Add `context.end()` method to be used from inside route actions (PLANNED)

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

[unreleased]: https://github.com/kriasoft/react-starter-kit/compare/v1.0.0-beta.1...HEAD
[v1.0.0-beta.1]: https://github.com/kriasoft/react-starter-kit/compare/v0.0.7...v1.0.0-beta.1
[v0.0.7]: https://github.com/kriasoft/react-starter-kit/compare/v0.0.6...v0.0.7
