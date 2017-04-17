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


## Learn more

* [Getting Started](https://github.com/kriasoft/universal-router/blob/master/docs/getting-started.md)
* [Universal Router API](https://github.com/kriasoft/universal-router/blob/master/docs/api.md)


## Sponsors

Does your company use Universal Router in production? Please consider
[sponsoring this project](https://opencollective.com/universal-router#sponsor).
Your help will allow maintainers to dedicate more time and resources to its development and support.

<a href="https://opencollective.com/universal-router/sponsor/0/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/0/avatar.svg" height="64">
</a>
<a href="https://opencollective.com/universal-router/sponsor/1/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/1/avatar.svg">
</a>
<a href="https://opencollective.com/universal-router/sponsor/2/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/2/avatar.svg">
</a>
<a href="https://opencollective.com/universal-router/sponsor/3/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/3/avatar.svg">
</a>
<a href="https://opencollective.com/universal-router/sponsor/4/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/4/avatar.svg">
</a>
<a href="https://opencollective.com/universal-router/sponsor/5/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/5/avatar.svg">
</a>
<a href="https://opencollective.com/universal-router/sponsor/6/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/6/avatar.svg">
</a>
<a href="https://opencollective.com/universal-router/sponsor/7/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/7/avatar.svg">
</a>
<a href="https://opencollective.com/universal-router/sponsor/8/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/8/avatar.svg">
</a>
<a href="https://opencollective.com/universal-router/sponsor/9/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/9/avatar.svg">
</a>


## Backers

♥ Universal Router? [Become a backer](https://opencollective.com/universal-router#backer)
to show your support and help us maintain and improve this open source project
and get your image on our README with a link to your site.

<a href="https://opencollective.com/universal-router/backer/0/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/0/avatar.svg" height="64">
</a>
<a href="https://opencollective.com/universal-router/backer/1/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/1/avatar.svg">
</a>
<a href="https://opencollective.com/universal-router/backer/2/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/2/avatar.svg">
</a>
<a href="https://opencollective.com/universal-router/backer/3/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/3/avatar.svg">
</a>
<a href="https://opencollective.com/universal-router/backer/4/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/4/avatar.svg">
</a>
<a href="https://opencollective.com/universal-router/backer/5/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/5/avatar.svg">
</a>
<a href="https://opencollective.com/universal-router/backer/6/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/6/avatar.svg">
</a>
<a href="https://opencollective.com/universal-router/backer/7/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/7/avatar.svg">
</a>
<a href="https://opencollective.com/universal-router/backer/8/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/8/avatar.svg">
</a>
<a href="https://opencollective.com/universal-router/backer/9/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/9/avatar.svg">
</a>
