# Contributing

First of all, thanks for your interest in contributing to the universal-router-ts! 🎉

PRs are the preferred way to spike ideas and address issues, if you have time. If you plan on contributing frequently, please feel free to ask to become a maintainer; the more the merrier. 🤙

## Technical overview

This library uses following libraries for development:

- [typescript](http://www.typescriptlang.org/) for typed JavaScript and transpilation
- [jest](https://jestjs.io/) for unit testing
  - run `yarn test:watch` during development
- [rollup](https://rollupjs.org/guide/en) for creating UMD bundles
- [yarn](https://yarnpkg.com/lang/en/) for package management
- [npm scripts](https://docs.npmjs.com/misc/scripts) for executing tasks

### 🧪 Tests

Test are written and run via Jest 💪

```sh
# Run whole test suite once
yarn test
# Run test in watch mode
yarn test:watch
# Ged code coverage
yarn test:coverage
```

### 💅 Style guides

Style guides are enforced by robots _(I meant prettier and tslint of course 🤖 )_, so they'll let you know if you screwed something, but most of the time, they'll autofix things for you. Magic right ?

Lint and format codebase via npm-script:

```sh
#Format and fix lint errors
yarn ts:style:fix
```

#### Commit conventions (via commitizen)

- this is preferred way how to create conventional-changelog valid commits
- if you prefer your custom tool we provide a commit hook linter which will error out, it you provide invalid commit message
- if you are in rush and just wanna skip commit message validation just prefix your message with `WIP: something done` ( if you do this please squash your work when you're done with proper commit message so standard-version can create Changelog and bump version of your library appropriately )

```sh
# invoke [commitizen CLI](https://github.com/commitizen/cz-cli)
yarn commit
```

### 📖 Documentation

```sh
yarn docs
```

## Getting started

### Creating a Pull Request

If you've never submitted a Pull request before please visit http://makeapullrequest.com/ to learn everything you need to know.

#### Setup

1.  Fork the repo.
1.  `git clone` your fork.
1.  Make a `git checkout -b branch-name` branch for your change.
1.  Run `yarn install --ignore-scripts` (make sure you have node and yarn installed first)
    Updates

1.  Make sure to add unit tests
1.  If there is a `*.spec.ts` file, update it to include a test for your change, if needed. If this file doesn't exist, please create it.
1.  Run `yarn test` or `yarn test:watch` to make sure all tests are working, regardless if a test was added.

---

## 🚀 Publishing

> releases are handled by awesome [standard-version](https://github.com/conventional-changelog/standard-version)

> #### NOTE:
>
> you have to create npm account and register token on your machine
> 👉 `npm adduser`
>
> If you are using scope (you definitely should 👌) don't forget to [`--scope`](https://docs.npmjs.com/cli/adduser#scope)

Execute `yarn release` which will handle following tasks:

- bump package version and git tag
- update/(create if it doesn't exist) CHANGELOG.md
- push to github master branch + push tags
- publish build packages to npm

> releases are handled by awesome [standard-version](https://github.com/conventional-changelog/standard-version)

### Initial Release (no package.json version bump):

```sh
yarn release --first-release
```

### Pre-release

- To get from `1.1.2` to `1.1.2-0`:

`yarn release --prerelease`

- **Alpha**: To get from `1.1.2` to `1.1.2-alpha.0`:

`yarn release --prerelease alpha`

- **Beta**: To get from `1.1.2` to `1.1.2-beta.0`:

`yarn release --prerelease beta`

### Dry run

#### version bump + changelog

```sh
# See what next release version would be with updated changelog
yarn standard-version --dry-run
```

#### npm publish

```sh
# check what files are gonna be published to npm
yarn release:preflight
```

## License

By contributing your code to the universal-router-ts GitHub Repository, you agree to license your contribution under the MIT license.
