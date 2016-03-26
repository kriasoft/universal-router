---
title: Getting Started ∙ Universal Router
---

## Getting Started

This router is built around a middleware approach used in Express and Koa, so if you're already
familiar with any of these frameworks, learning Universal Router should be a breeze. The code
samples below assume that you're using ES2015 flavor of JavaScript via [Babel](http://babeljs.io/).

You can start by installing Universal Router library via [npm](https://www.npmjs.com/package/universal-router)
by running:

```bash
$ npm install universal-router --save
```

This module exports a `Router` class responsible for storing the list of routes, traversing this
list, and executing middleware functions (actions) for each of the matched routes. Each "route" is
just a parametrized path string along with one ore more route actions. To demonstrate it, let's
initialize a new router as follows:
 
```js
import Router from 'universal-router';

const router = new Router()
  .route('/', () => console.log('show home page'))
  .route('/about', () => console.log('show about page'));

router.dispatch('/about');
```

When you run this code, it should print "`show about page`" text to the console window. And it
works the same way in both a browser or Node.js environments.

An action can return an arbitrary value that you can obtain by running `.dispatch(context)` as
the following code demonstrates:

```js
import Router from 'universal-router';

const router = new Router()
  .route('/', () => '<h1>Home page<h1>')
  .route('/about', () => '<h1>About page</h1>');

(async function(location) {
  const result = await router.dispatch(location);
  console.log(result);
})('/about')
```

...

Sorry, the rest of the guide is currently under development. Come back soon. 


