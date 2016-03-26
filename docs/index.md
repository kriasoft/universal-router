---
title: Universal Router ∙ Isomorphic routing solution for JavaScript applications
---

## Universal Router

A simple middleware-style router that can be used in both client-side (e.g. React, Vue.js) and
server-side appliactions (e.g. Node.js/Express, Koa).

### Why use Universal Router?

* It has [simple code](https://github.com/kriasoft/universal-router/blob/master/src/Router.js)
  with minimum dependencies (just `path-to-regexp` and `babel-runtime`)
* It can be used with any JavaScript framework such as React, Vue.js etc
* It uses the same middleware approach used in Express and Koa, making it easy to learn

### How does it look like?

```js
import Router from 'universal-router';

const router = new Router()
  .route('/', () => 'Home page')
  .route('/:username', async (context, { username }) => {
    const resp = await fetch(`/api/users/${username}`);
    const data = await resp.json();
    return `Hello, ${data.displayName}!`;
  });

router.dispatch('/nick').then(result => {
  console.log(result);
});
```

### Learn more

* [Getting Started](./getting-started)
* [Universal Router API](./api)


