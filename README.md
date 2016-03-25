# Universal Router — "isomorphic" routing for JavaScript applications

[![NPM version](http://img.shields.io/npm/v/universal-router.svg?style=flat-square)](https://www.npmjs.com/package/universal-router)
[![NPM downloads](http://img.shields.io/npm/dm/universal-router.svg?style=flat-square)](https://www.npmjs.com/package/universal-router)
[![Build Status](http://img.shields.io/travis/kriasoft/universal-router/master.svg?style=flat-square)](https://travis-ci.org/kriasoft/universal-router)
[![Dependency Status](http://img.shields.io/david/kriasoft/universal-router.svg?style=flat-square)](https://david-dm.org/kriasoft/universal-router)
[![Chat](http://img.shields.io/badge/chat_room-%23universal--router-blue.svg?style=flat-square)](https://gitter.im/kriasoft/universal-router)

For more information visit [www.kriasoft.com/universal-router](https://www.kriasoft.com/universal-router/)

## How to Install

```sh
$ npm install universal-router --save
```

## Quick Start

```js
import React from 'react';
import ReactDOM from 'react-dom';
import Router from 'universal-router';
import NotFoundPage from './components/NotFoundPage';
import ErrorPage from './components/ErrorPage';

const router = new Router(on => {

  on('*', async (state, next) => {
    const Layout = require('./components/Layout');
    const component = await next();
    if (component === undefined) {
      return undefined;
    }
    return <Layout context={state.context}>{component}</Layout>;
  });

  on('/', () => {
    const HomePage = require('./components/HomePage');
    return <HomePage />;
  });

  on('/products', async () => {
    const [data, require] = await Promise.all([
      http.get('/api/products'),
      new Promise(resolve => require.ensure(['./components/ProductsPage'], resolve))
    ]);
    const ProductsPage = require('./components/ProductsPage');
    return data ? <ProductsPage products={data} /> : undefined;
  });

  on('/products/:name', async (state) => {
    const [data, require] = await Promise.all([
      http.get(`/api/products/${state.params.name}`),
      new Promise(resolve => require.ensure(['./components/ProductInfoPage'], resolve))
    ]);
    const ProductInfoPage = require('./components/ProductInfoPage');
    return data ? <ProductInfoPage product={data} /> : undefined;
  });

  on('error', (state, error) => state.statusCode === 404 ?
    <Layout context={state.context} error={error}><NotFoundPage /></Layout> :
    <Layout context={state.context} error={error}><ErrorPage /></Layout>
  );

});

await router.dispatch({ path: '/products/example' }, (state, component) => {
  ReactDOM.render(component, document.getElementById('app'));
});
```

## Related Projects

* [React Starter Kit](https://github.com/kriasoft/react-starter-kit)
* [Babel Starter Kit](https://github.com/kriasoft/babel-starter-kit)
* [React Static Boilerplate](https://github.com/koistya/react-static-boilerplate)

### Support

* [#universal-router](https://gitter.im/kriasoft/universal-router) on Gitter
* [#react-starter-kit](https://gitter.im/kriasoft/react-starter-kit) on Gitter
* [@koistya](https://www.codementor.io/koistya) on Codementor

## License

The MIT License © Konstantin Tarkus ([@koistya](https://twitter.com/koistya))
