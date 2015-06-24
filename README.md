# Babel Starter Kit

> A project template for authoring and publishing JavaScript libraries

### Features

&nbsp; &nbsp; ✓ Next generation JavaScript via [Babel](http://babeljs.io/)<br>
&nbsp; &nbsp; ✓ Publish to [NPM](https://www.npmjs.com/) as ES5, ES6+ and UMD<br>
&nbsp; &nbsp; ✓ Pre-configured tests with [Mocha](http://mochajs.org/), [Chai](http://chaijs.com/) and [Sinon](http://sinonjs.org/)<br>
&nbsp; &nbsp; ✓ Project documentation boilerplate<br>
&nbsp; &nbsp; ✓ Cross-platform, minimum dependencies<br>

### Getting Started

Start by cloning this repo and installing project dependencies:

```
$ git clone -o babel-starter-kit https://github.com/kriasoft/babel-starter-kit.git MyProject
$ cd MyProject
$ npm install
```

Update your name in `LICENSE.txt` and project information in `package.json` and
`README.md` files. Write your code in `src` folder, write tests in `test`
folder. Run `npm run build` to compile the source code into a distributable
format. Write documentation in markdown format in `docs` folder. Run
`npm run serve` to launch a development server with the documentation site.

### How to Test

```shell
$ npm run lint          # Lint your code
$ npm test              # Run unit tests
```

### How to Update

Down the road you can fetch and merge the recent changes from this repo back
into your project:

```
$ git checkout master
$ git fetch babel-starter-kit
$ git merge babel-starter-kit/master
$ npm install
```

### Copyright

Copyright (c) 2015 Konstantin Tarkus ([@koistya](https://twitter.com/koistya))
&nbsp;|&nbsp; The MIT License
