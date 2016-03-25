---
id: api
title: API ∙ Universal Router
---

## Universal Router API

### new Router([routes])

Creates a new instance of the router, where `[routes]` is an optional list of routes. For example:

```js
const router = new Router()
  .route('/one', () => { /* action */ })
  .route('/two', () => { /* action */ })
  .route('/tree', () => { /* action */ });
````

Which can be also written as:

```js
const routes = [
  { path: '/one', action: () => { /* action */ } },
  { path: '/two', action: () => { /* action */ } },
];
const router = new Router()
  .route('/tree', () => { /* action */ });
```

#### URL Parameters

Named route parameters are captured and added to `context.params`.

```js
const router = new Router()
  .route('/:category/:title', (context) => {
    console.log(context.params);
    // => { category: 'programming', title: 'how-to-code' }
  });

router.dispatch('/programming/how-to-code');
````

Alternatively, captured parameters can be accessed via the second argument to an action method like so:

```js
const router = new Router()
  .route('/:category/:title', (context, { category, title }) => {
    console.log(category, title);
    // => programming how-to-code
  });

router.dispatch('/programming/how-to-code');
````

### router.route(path, ...actions) ⇒ `Router`

Adds a new router to the internal collection. Returns the router instance for chaining. See examples
above.

### router.dispatch(context) ⇒ `Promise`

This tells the router to find the first route matching the specified `path` string. When such a
route found, the router will execute its actions one-by-one starting from the first one, until one
of them returns anything other than `undefined`, after that it returns whatever the action method
returned back to the caller by resolving the Promise.

The `context` argument can be either a path string such as `/programming/how-to-code` or an object
with `path`, `query` variables and some optional arbitrary values that needs to be passed to the
route actions. For example:

```js
import Express from 'express';
import Router from 'universal-router';

const app = new Express();
const router = new Router();

// TODO: Configure routes and middlewares

app.use((req, res, next) => {
  router.dispatch({ path: req.path, query: req.query, user: req.user })
    .then(result => res.send(result))
    .catch(err => next(err));
});
```

...

Sorry, the rest of the guide is currently under development. Come back soon. 
