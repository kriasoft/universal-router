# React.js Routing and Navigation

[![NPM version](http://img.shields.io/npm/v/react-routing.svg?style=flat-square)](http://npmjs.org/react-routing)
[![NPM downloads](http://img.shields.io/npm/dm/react-routing.svg?style=flat-square)](http://npmjs.org/react-routing)
[![Build Status](http://img.shields.io/travis/kriasoft/react-routing/master.svg?style=flat-square)](https://travis-ci.org/kriasoft/react-routing)
[![Dependency Status](http://img.shields.io/david/kriasoft/react-routing.svg?style=flat-square)](https://david-dm.org/kriasoft/react-routing)
[![Chat](http://img.shields.io/badge/chat_room-%23react--routing-blue.svg?style=flat-square)](https://gitter.im/kriasoft/react-routing)

> Routing and navigation solution for React.js applications

For more information visit [www.kriasoft.com/react-routing](http://www.kriasoft.com/react-routing)

## How to Install

```sh
$ npm install react-routing --save
```

## Quick Start

```js
import { Router } from 'react-routing';

const router = new Router();

router.use('/', () => require('./components/Layout'));
router.route('/store', () => require('./components/Store'));
router.route('/store/:name', async (state) => {
  const component = require('./components/Product');
  const data = await http.get(`/api/products/${state.params.name}`);
  return [component, data];
});

router.run();
```

## Related Projects

 * [React Starter Kit](https://github.com/kriasoft/react-starter-kit.git)
 * [Babel Starter Kit](https://github.com/kriasoft/babel-starter-kit.git)

### Support

 * [#react-routing](https://gitter.im/kriasoft/react-routing) on Gitter
 * [@koistya](https://www.codementor.io/koistya) on Codementor

## License

The MIT License © Konstantin Tarkus ([@koistya](https://twitter.com/koistya))
