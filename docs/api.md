---
id: api
title: API ∙ Universal Router
---

# Universal Router API

## `resolve(routes, { path, ...context })` ⇒ `Promise<any>`

Traverses the list of routes in the order they are defined until it finds the first route that
matches provided URL path string and whose action method returns anything other than `null` or `undefined`.

```js
import { resolve } from 'universal-router';

const routes = [
  {
    path: '/one',
    action: () => 'Page One'
  },
  {
    path: '/two',
    action: () => `Page Two`
  }
];

resolve(routes, { path: '/one' })
  .then(result => console.log(result));
  // => Page One
```

Where `action` is just a regular function that may, or may not, return any arbitrary data
— a string, a React component, anything!


## `href(routes, routeName[, routeParams])` ⇒ `String|null`

Traverses the list of routes in the order they are defined until it finds the first route that
matches provided name string.

```js
// ./routes/index.js
import { href } from 'universal-router';

const routes = {
  path: '/',
  children: [
    { name: 'one', path: '/one', action: () => {} },
    { path: '/two', action: () => {}, children: [
      { path: '/three', action: () => {} }
      { name: 'four', path: '/four/:four', action: () => {} }
    ] }
  ]
};

export default routes;

console.log(href(routes, 'one'));
// => /one

console.log(href(routes, 'three'));
// => null

console.log(href(routes, 'four', { four: 'a' }));
// => /two/four/a
```

```js
// ./components/Link/index.js
import React from 'react';
import { href } from 'universal-router';
import routes from '../../routes';

const Link = ({ routeName, routeParams, children }) => (
  <a href={href(routes, routeName, routeParams)}>{children}</a>
);

// ./components/Navigation.js
import React from 'react';
import Link from './components/Link';

const Navigation = () => (
  <nav>
    <Link routeName={'one'}>One</Link>
    <Link routeName={'four'} routeParams={{ four: 'a' }}>Four</Link>
  </nav>
);
```


## Nested Routes

Each route may have an optional `children: [ ... ]` property containing the list of child routes:

```js
const routes = {
  path: '/admin',
  children: [
    {
      path: '/',                       // www.example.com/admin
      action: () => 'Admin Page'
    },
    {
      path: '/users',
      children: [
        {
          path: '/',                   // www.example.com/admin/users
          action: () => 'User List'
        },
        {
          path: '/:username',          // www.example.com/admin/users/john
          action: () => 'User Profile'
        }
      ]
    }
  ]
};

resolve(routes, { path: '/admin/users/john' })
  .then(result => console.log(result));
  // => User Profile
```


## URL Parameters

**Named route parameters** are captured and added to `context.params`.

```js
const routes = [
  {
    path: '/hello/:username',
    action: (context) => `Welcome, ${context.params.username}!`
  }
];

resolve(routes, { path: '/hello/john' })
  .then(result => console.log(result));
  // => Welcome, john!
```

Alternatively, captured parameters can be accessed via the second argument to an action method like so:

```js
const routes = [
  {
    path: '/hello/:username',
    action: (ctx, { username }) => `Welcome, ${username}!`
  }
];

resolve(routes, { path: '/hello/john' })
  .then(result => console.log(result));
  // => Welcome, john!
```

This functionality is powered by [path-to-regexp](https://github.com/pillarjs/path-to-regexp) npm module
and works the same way as the routing solutions in many popular JavaScript frameworks such as Express and Koa.
Also check out online [router tester](http://forbeslindesay.github.io/express-route-tester/).


## Context

In addition to a URL path string, any arbitrary data can be passed to the router's `resolve()` method,
that becomes available inside action methods.

```js
const routes = [
  {
    path: '/hello',
    action(context) {
      return `Welcome, ${context.user}!`
    }
  }
];

resolve(routes, { path: '/hello', user: 'admin' })
  .then(result => console.log(result));
  // => Welcome, admin!
```


## Async Routes

The router works great with asynchronous functions out of the box!

```js
const routes = [
  {
    path: '/hello/:username',
    async action({ params }) {
      const resp = await fetch(`/api/users/${params.username}`);
      const user = await resp.json();
      if (user) return `Welcome, ${user.displayName}!`;
    }
  }
];

resolve(routes, { path: '/hello/john' })
  .then(result => console.log(result));
  // => Welcome, John Brown!
```

Use [Babel](http://babeljs.io/) to transpile your code with `async` / `await` to normal JavaScript.
Alternatively, stick to ES6 Promises:

```js
const route = {
  path: '/hello/:username',
  action({ params }) {
    return fetch(`/api/users/${params.username}`)
      .then(resp => resp.json())
      .then(user => user && `Welcome, ${user.displayName}!`);
  }
};
```


## Middlewares

Any route action function may act as a **middleware** by calling `context.next()`.

```js
const routes = [
  {
    path: '/',
    async action({ next }) {
      console.log('middleware: start');
      const child = await next();
      console.log('middleware: end');
      return child;
    },
    children: [
      {
        path: '/hello',
        action() {
          console.log('route: return a result');
          return 'Hello, world!';
        }
      }
    ]
  }
];

resolve(routes, { path: '/hello' });

// Prints:
//   middleware: start
//   route: return a result
//   middleware: end
```

...

Sorry, the rest of the guide is currently under development. Come back soon. 
