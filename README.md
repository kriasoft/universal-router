# React.js Routing and Navigation ![status](https://img.shields.io/badge/status-early%20preview-orange.svg?style=flat-square)

> Routing and navigation solution for React.js applications. For more information please visit
> [How to implement routing from scratch](https://github.com/kriasoft/react-starter-kit/blob/master/docs/recipes/how-to-implement-routing.md)
> in [React Starter Kit](https://github.com/kriasoft/react-starter-kit/blob/master/docs/recipes/how-to-implement-routing.md).

[![NPM](https://nodei.co/npm/react-routing.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/react-routing)

## How to Install

```sh
$ npm install react-routing --save
```

## How to Use

```js
import { Router } from 'react-routing';

const router = new Router();

router.on('/', require('./components/HomePage');
router.on('/store', require('./components/Store'));
router.on('/store/:item', async (item) => {
  const data = await http.get(`/api/products/${item}`);
  return [require('./components/Product'), data];
}

router.run();
```

For more information visit [kriasoft.com/react-routing](http://www.kriasoft.com/react-routing)

## License

Copyright © 2015 Konstantin Tarkus ([@koistya](https://twitter.com/koistya))
&nbsp;|&nbsp; The MIT License
