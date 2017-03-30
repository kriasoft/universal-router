---
title: Universal Router ∙ Isomorphic routing solution for JavaScript applications
---

# Universal Router

A simple middleware-style router that can be used in both client-side (e.g. React, Vue.js) and
server-side applications (e.g. Node.js/Express, Koa).


## Why use Universal Router?

* It has [simple code](https://github.com/kriasoft/universal-router/blob/master/src/Router.js)
  with only single [path-to-regexp](https://github.com/pillarjs/path-to-regexp) dependency
* It can be used with any JavaScript framework such as React, Vue.js etc
* It uses the same middleware approach used in Express and Koa, making it easy to learn
* Routes are plain javascript objects with which you can interact as you like
* Support both [imperative](https://en.wikipedia.org/wiki/Imperative_programming) and
  [declarative](https://en.wikipedia.org/wiki/Declarative_programming) routing style


## How does it look like?

```js
import Router from 'universal-router';

const routes = [
  {
    path: '/',
    action: () => `<h1>Home</h1>`
  },
  {
    path: '/posts',
    action: () => console.log('checking child routes for /posts'),
    children: [
      {
        path: '/',
        action: () => `<h1>Posts</h1>`
      },
      {
        path: '/:id',
        action: (context) => `<h1>Post #${context.params.id}</h1>`
      }
    ]
  },
];

const router = new Router(routes);

router.resolve('/posts').then(html => {
  document.body.innerHTML = html;
});
```

**Note**: If you're using the router with Node v5 and below, import it as follows:

```js
import Router from 'universal-router/legacy';
````


## Learn more

* [Getting Started](https://github.com/kriasoft/universal-router/blob/master/docs/getting-started.md)
* [Universal Router API](https://github.com/kriasoft/universal-router/blob/master/docs/api.md)


## Backers

♥ Universal Router? Help us keep it alive by [donating funds](https://www.patreon.com/tarkus)
to cover project expenses!

<a href="https://github.com/koistya" target="_blank">
  <img src="https://github.com/koistya.png?size=64" width="64" height="64" alt="Konstantin Tarkus">
</a>
<a href="https://www.patreon.com/tarkus" target="_blank">
  <img src="https://opencollective.com/static/images/become_backer.svg" width="64" height="64" alt="Become a backer">
</a>
