---
title: Getting Started ∙ Universal Router
---

# Getting Started

This router is built around a middleware approach used in Express and Koa, so if you're already
familiar with any of these frameworks, learning Universal Router should be a breeze. The code
samples below assume that you're using ES2015 flavor of JavaScript via [Babel](http://babeljs.io/).

You can start by installing **Universal Router** library via [npm](https://www.npmjs.com/package/universal-router)
by running:

```sh
$ npm install universal-router --save
```

This module contains a `resolve` function that responsible for traversing the list of routes, until it
finds the first route matching the provided URL path string and whose action method returns anything
other than `null` or `undefined`. Each route is just a plain JavaScript object having `path`, `action`, and
`children` (optional) properties.
 
```js
import { resolve } from 'universal-router';

const routes = [
  { path: '/one', action: () => '<h1>Page One</h1>' },
  { path: '/two', action: () => '<h1>Page Two</h1>' }
];

resolve(routes, { path: '/one' }).then(result => {
  document.body.innerHTML = result || <h1>Not Found</h1>;
  // renders: <h1>Page One</h1>
});
```


## Use with React

```js
import React from 'react';
import ReactDOM from 'react-dom';
import { resolve } from 'universal-router';

const routes = [
  { path: '/one', action: () => <h1>Page One</h1> },
  { path: '/two', action: () => <h1>Page Two</h1> }
];

resolve(routes, { path: '/one' }).then(component => {
  ReactDOM.render(component, document.body);
  // renders: <h1>Page One</h1>
});
```
