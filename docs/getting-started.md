---
title: Getting Started ∙ Universal Router
---

## Getting Started

This router is built around a middleware approach used in Express and Koa, so if you're already
familiar with any of these frameworks, learning Universal Router should be a breeze. The code
samples below assume that you're using ES2015 flavor of JavaScript via [Babel](http://babeljs.io/).

You can start by installing Universal Router library via [npm](https://www.npmjs.com/package/universal-router)
by running:

```sh
$ npm install universal-router --save
```

This module has a `match` method that responsible for traversing the list of routes, until it finds
a matching route whose action method returns anything other thand `undefined`. Each route is just a
plain JavaScript object having `path`, `action`, and `children` (optional) properties.
 
```js
import { match } from 'universal-router';

const rotues = [
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
        action: (context) => `<h1>Post #${context.params.id}`
      }
    ]
  },
];

match(routes, '/posts/123').then(html => {
  document.body.innerHTML = html;
  // => renders <h1>Post #123</h1>
});
```

...

Sorry, the rest of the guide is currently under development. Come back soon. 


