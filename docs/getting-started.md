---
title: Getting Started ∙ Babel Starter Kit
---

# Getting Started

Start by cloning this repo and installing project dependencies:

```shell
$ git clone -o babel-starter-kit -b master --single-branch \
      https://github.com/kriasoft/babel-starter-kit.git MyProject
$ cd MyProject
$ npm install
```

Update your name in `LICENSE.txt` and project information in `package.json` and
`README.md` files. Write your code in `src` folder, write tests in `test`
folder. Run `npm run build` to compile the source code into a distributable
format. Write documentation in markdown format in `docs` folder. Run
`npm start` to launch a development server with the documentation site.

## How to Test

```shell
$ npm run lint          # Lint your code
$ npm test              # Run unit tests, or `npm test -- --watch`
```

## How to Update

Down the road you can fetch and merge the recent changes from this repo back
into your project:

```shell
$ git checkout master
$ git fetch babel-starter-kit
$ git merge babel-starter-kit/master
$ npm install
```
