---
id: api
title: API ∙ Universal Router
---

## Universal Router API

### `match(routes, { path, ...context })` ⇒ `any`

Traverses the list of routes in the order they are defined until it finds the first route that
matches provided URL path string and whose action method returns anything other than `undefined`.

```js
import { match } from 'universal-router';

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

match(routes, { path: '/one' })
  .then(result => console.log(result));
  // => Page One
```

#### URL Parameters

Named route parameters are captured and added to `context.params`.

```js
const routes = [
  {
    path: '/hello/:username',
    action: (context) => `Welcome, ${context.params.username}!`
  }
];

match(routes, { path: '/hello/john' })
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

match(routes, { path: '/hello/john' })
  .then(result => console.log(result));
  // => Welcome, john!
```

#### Async Routes

##### Example 1:

```js
const routes = [
  {
    path: '/hello',
    action: () => new Promise(resolve => {
      setTimeout(() => resolve('Welcome!'), 1000);
    })
  }
];

match(routes, { path: '/hello' })
  .then(result => console.log(result));
  // => Welcome!
```

##### Example 2:

```js
const routes = [
  {
    path: '/hello/:username',
    async action(ctx, { username }) {
      const resp = await fetch(`/api/users/${username}`);
      const user = await resp.json();
      if (user) {
        return `Welcome, ${user.displayName}!`;
      }
    }
  }
];

match(routes, { path: '/hello/john' })
  .then(result => console.log(result));
  // => Welcome, John Brown!
```

...

Sorry, the rest of the guide is currently under development. Come back soon. 
