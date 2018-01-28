# Getting Started

This router is built around a middleware approach used in Express and Koa, so if you're already
familiar with any of these frameworks, learning Universal Router should be a breeze. The code
samples below assume that you're using ES2015 flavor of JavaScript via [Babel](http://babeljs.io/).

You can start by installing **Universal Router** library via [npm](https://www.npmjs.com/package/universal-router)
by running:

```sh
npm install universal-router --save
```

This module contains a `UniversalRouter` class with a single `router.resolve` method that responsible for traversing
the list of routes, until it finds the first route matching the provided URL path string and whose action method
returns anything other than `null` or `undefined`. Each route is just a plain JavaScript object having `path`,
`action`, and `children` (optional) properties.
 
```js
import UniversalRouter from 'universal-router'

const routes = [
  { path: '/one', action: () => '<h1>Page One</h1>' },
  { path: '/two', action: () => '<h1>Page Two</h1>' },
  { path: '(.*)', action: () => '<h1>Not Found</h1>' }
]

const router = new UniversalRouter(routes)

router.resolve({ pathname: '/one' }).then(result => {
  document.body.innerHTML = result
  // renders: <h1>Page One</h1>
})
```

If you don't want to use npm to manage client packages, the `universal-router` npm package
also provide single-file distributions, which are hosted on a [CDN](https://unpkg.com/):

```html
<script src="https://unpkg.com/universal-router/universal-router.js"></script>
<script src="https://unpkg.com/universal-router/universal-router.min.js"></script>
<script src="https://unpkg.com/universal-router/universal-router-generate-urls.js"></script>
<script src="https://unpkg.com/universal-router/universal-router-generate-urls.min.js"></script>
```

**Note**: You may need to include
[Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map),
[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) and
[Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
polyfills for compatibility with older browsers.

## Use with React

```jsx
import React from 'react'
import ReactDOM from 'react-dom'
import UniversalRouter from 'universal-router'

const routes = [
  { path: '/one', action: () => <h1>Page One</h1> },
  { path: '/two', action: () => <h1>Page Two</h1> },
  { path: '(.*)', action: () => <h1>Not Found</h1> }
]

const router = new UniversalRouter(routes)

router.resolve({ pathname: '/one' }).then(component => {
  ReactDOM.render(component, document.body)
  // renders: <h1>Page One</h1>
})
```

## Learn more

* [Universal Router API](https://github.com/kriasoft/universal-router/blob/master/docs/api.md)
* [Redirects](https://github.com/kriasoft/universal-router/blob/master/docs/redirects.md)
