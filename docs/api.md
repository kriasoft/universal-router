# Universal Router API

## `const router = new UniversalRouter(routes, options)`

Creates an universal router instance which have a single
[`router.resolve()`](#routerresolve-pathname-context---promiseany) method.
`UniversalRouter` constructor expects a plain javascript object for the first `routes` argument
with any amount of params where only `path` is required, or array of such objects.
Second `options` argument is optional where you can pass the following:

- `context` - an object with any data which you want to pass to `resolveRoute` function.\
  See [Context](#context) section below for details.
- `baseUrl` - the base URL of the app. By default is empty string `''`.\
  If all the URLs in your app are relative to some other "base" URL, use this option.
- `resolveRoute` - function for any custom route handling logic.\
  For example you can define this option to work with routes in declarative manner.\
  By default the router calls the `action` method of matched route.
- `errorHandler` - function for global error handling. Called with an
  [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
  and [Context](#context) arguments every time the route is not found or threw an error.

```js
import UniversalRouter from 'universal-router'

const routes = {
  path: '/page', // string, array of strings, or a regular expression, optional
  name: 'page', // unique string, optional
  parent: null, // route object or null, automatically filled by the router
  children: [], // array of route objects, optional

  // function, optional
  action(context, params) {
    // action method should return anything except `null` or `undefined` to be resolved by router
    // otherwise router will throw `Page not found` error if all matched routes returned nothing
    return '<h1>The Page</h1>'
  },

  // ...
}

const options = {
  context: { user: null },
  baseUrl: '/base',
  resolveRoute(context, params) {
    if (typeof context.route.action === 'function') {
      return context.route.action(context, params)
    }
    return undefined
  },
  errorHandler(error, context) {
    console.error(error)
    console.info(context)
    return error.status === 404
      ? '<h1>Page Not Found</h1>'
      : '<h1>Oops! Something went wrong</h1>'
  },
}

const router = new UniversalRouter(routes, options)
```

## `router.resolve({ pathname, ...context })` ⇒ `Promise<any>`

Traverses the list of routes in the order they are defined until it finds the first route
that matches provided URL path string and whose `action` function returns anything
other than `null` or `undefined`.

```js
const router = new UniversalRouter([
  { path: '/one', action: () => 'Page One' },
  { path: '/two', action: () => 'Page Two' },
])

router.resolve({ pathname: '/one' }).then((result) => console.log(result))
// => Page One
```

Where `action` is just a regular function that may, or may not, return any arbitrary data
— a string, a React component, anything!

## Nested Routes

Each route may have an optional `children: [ ... ]` property containing the list of child routes:

```js
const router = new UniversalRouter({
  path: '/admin',
  children: [
    {
      path: '', // www.example.com/admin
      action: () => 'Admin Page',
    },
    {
      path: '/users',
      children: [
        {
          path: '', // www.example.com/admin/users
          action: () => 'User List',
        },
        {
          path: '/:username', // www.example.com/admin/users/john
          action: () => 'User Profile',
        },
      ],
    },
  ],
})

router
  .resolve({ pathname: '/admin/users/john' })
  .then((result) => console.log(result))
// => User Profile
```

Setting the `children` property to an empty list will act as a catch-all capture all routes beneath that path

```js
const router = new UniversalRouter({
  path: '/admin',
  children: [],
  action: () => 'Admin Page',
})

router
  .resolve({ pathname: '/admin/users/john' })
  .then((result) => console.log(result))
// => Admin Page
router
  .resolve({ pathname: '/admin/some/other/page' })
  .then((result) => console.log(result))
// => Admin Page
```

## URL Parameters

**Named route parameters** are captured and added to `context.params`.

```js
const router = new UniversalRouter({
  path: '/hello/:username',
  action: (context) => `Welcome, ${context.params.username}!`,
})

router
  .resolve({ pathname: '/hello/john' })
  .then((result) => console.log(result))
// => Welcome, john!
```

Alternatively, captured parameters can be accessed via the second argument
to an action method like so:

```js
const router = new UniversalRouter({
  path: '/hello/:username',
  action: (ctx, { username }) => `Welcome, ${username}!`,
})

router
  .resolve({ pathname: '/hello/john' })
  .then((result) => console.log(result))
// => Welcome, john!
```

Router preserves the `context.params` values from the parent router.
If the parent and the child have conflicting param names, the child's value take precedence.

This functionality is powered by [path-to-regexp](https://github.com/pillarjs/path-to-regexp)
npm module and works the same way as the routing solutions in many popular JavaScript frameworks
such as [Express](https://expressjs.com/) and [Koa](https://koajs.com/).
Also check out online [router tester](http://forbeslindesay.github.io/express-route-tester/).

## Context

In addition to a URL path string, any arbitrary data can be passed to the `router.resolve()` method,
that becomes available inside `action` functions.

```js
const router = new UniversalRouter({
  path: '/hello',
  action(context) {
    return `Welcome, ${context.user}!`
  },
})

router
  .resolve({ pathname: '/hello', user: 'admin' })
  .then((result) => console.log(result))
// => Welcome, admin!
```

Router supports `context` option in the `UniversalRouter` constructor
to support for specify of custom context properties only once.

```js
const context = {
  store: {},
  user: 'admin',
  // ...
}

const router = new UniversalRouter(route, { context })
```

Router always adds following parameters to the `context` object
before passing it to the `resolveRoute` function:

- `router` - Current router instance.
- `route` - Matched route object.
- `next` - Middleware style function which can continue resolving,
  see [Middlewares](#middlewares) section below for details.
- `pathname` - URL which was transmitted to `router.resolve()`.
- `baseUrl` - Base URL path relative to the path of the current route.
- `path` - Matched path.
- `params` - Matched path params,
  see [URL Parameters](#url-parameters) section above for details.

## Async Routes

The router works great with asynchronous functions out of the box!

```js
const router = new UniversalRouter({
  path: '/hello/:username',
  async action({ params }) {
    const resp = await fetch(`/api/users/${params.username}`)
    const user = await resp.json()
    if (user) return `Welcome, ${user.displayName}!`
  },
})

router
  .resolve({ pathname: '/hello/john' })
  .then((result) => console.log(result))
// => Welcome, John Brown!
```

Use [Babel](http://babeljs.io/) to transpile your code with `async` / `await` to normal JavaScript.
Alternatively, stick to ES6 Promises:

```js
const route = {
  path: '/hello/:username',
  action({ params }) {
    return fetch(`/api/users/${params.username}`)
      .then((resp) => resp.json())
      .then((user) => user && `Welcome, ${user.displayName}!`)
  },
}
```

## Middlewares

Any route action function may act as a **middleware** by calling `context.next()`.

```js
const router = new UniversalRouter({
  path: '', // optional
  async action({ next }) {
    console.log('middleware: start')
    const child = await next()
    console.log('middleware: end')
    return child
  },
  children: [
    {
      path: '/hello',
      action() {
        console.log('route: return a result')
        return 'Hello, world!'
      },
    },
  ],
})

router.resolve({ pathname: '/hello' })
// Prints:
//   middleware: start
//   route: return a result
//   middleware: end
```

Remember that `context.next()` iterates only child routes,
use `context.next(true)` to iterate through the all remaining routes.

Note that if the middleware action returns `null` then the router will skip all nested routes
and go to the next sibling route. But if the `action` is missing or returns `undefined`
then the router will try to match the child routes. This can be useful for permissions check.

```js
const middlewareRoute = {
  path: '/admin',
  action(context) {
    if (!context.user) {
      return null // route does not match (skip all /admin* routes)
    }
    if (context.user.role !== 'Admin') {
      return 'Access denied!' // return a page (for any /admin* urls)
    }
    return undefined // or `return context.next()` - try to match child routes
  },
  children: [
    /* admin routes here */
  ],
}
```

## Synchronous mode

For most application a Promise-based asynchronous API is the best choice.
But if you absolutely have to resolve your routes synchronously,
this option is available as an add-on.

Simply import `universal-router/sync` instead of `universal-router`
and you'll get almost the same API, but without the `Promise` support.

```diff
-import UniversalRouter from 'universal-router'
+import UniversalRouterSync from 'universal-router/sync'
```

Now the `resolve` method will synchronously return whatever
the matching route action returned (or throw an error).

```js
const router = new UniversalRouterSync([
  { path: '/one', action: () => 'Page One' },
  { path: '/two', action: () => 'Page Two' },
])

const result = router.resolve({ pathname: '/one' })

console.log(result) // => Page One
```

This implies that your `action` functions have to be synchronous too.

The `context.next` function will be synchronous too and will return whatever the matching action returned.

## URL Generation

In most web applications it's much simpler to just use a string for hyperlinks.

```js
const link1 = `<a href="/page">Page</a>`
const link2 = `<a href="/user/${username}">Profile</a>`
const link3 = `<a href="/search?q=${query}">Search</a>`
const link4 = `<a href="/faq#question">Question</a>`
// etc.
```

However for some types of web applications it may be useful to generate URLs dynamically based on route name.
That's why this feature is available as an add-on with simple API `generateUrls(router, options) ⇒ Function`
where returned function is used for generating urls `url(routeName, params) ⇒ String`.

```js
import UniversalRouter from 'universal-router'
import generateUrls from 'universal-router/generateUrls'

const routes = [
  { name: 'users', path: '/users' },
  { name: 'user', path: '/user/:username' },
]

const router = new UniversalRouter(routes, { baseUrl: '/base' })
const url = generateUrls(router)

url('users') // => '/base/users'
url('user', { username: 'john' }) // => '/base/user/john'
```

This approach also works fine for dynamically added routes at runtime.

```js
routes.children.push({ path: '/world', name: 'hello' })

url('hello') // => '/base/world'
```

Use `encode` option for custom encoding of URI path segments. By default
[encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)
is used.

```js
const prettyUrl = generateUrls(router, { encode: (value, token) => value })

url('user', { username: ':/' }) // => '/base/user/%3A%2F'
prettyUrl('user', { username: ':/' }) // => '/base/user/:/'
```

Provide a function to `stringifyQueryParams` option to generate URL with
[query string](http://en.wikipedia.org/wiki/Query_string) from unknown route params.

```js
const urlWithQueryString = generateUrls(router, {
  stringifyQueryParams: (params) => new URLSearchParams(params).toString(),
})

const params = { username: 'John', busy: '1' }
url('user', params) // => /base/user/John
urlWithQueryString('user', params) // => /base/user/John?busy=1
```

Or use external library such as [qs](https://github.com/ljharb/qs),
[query-string](https://github.com/sindresorhus/query-string), etc.

```js
import qs from 'qs'
generateUrls(router, { stringifyQueryParams: qs.stringify })
```

Option `uniqueRouteNameSep` allows using non-unique route names among different branches of nested routes.
The router will automatically generate unique names based on parent routes using the specified separator:

```js
const router = new UniversalRouter([
  {
    name: 'users',
    path: '/users',
    children: [{ name: 'list', path: '/list' }],
  },
  {
    name: 'pages',
    path: '/pages',
    children: [{ name: 'list', path: '/list' }],
  },
])
const url = generateUrls(router, { uniqueRouteNameSep: '.' })
url('users.list') // => /users/list
url('pages.list') // => /pages/list
```

## Recipes

- [Redirects](https://github.com/kriasoft/universal-router/blob/master/docs/redirects.md)
- [Request a recipe](https://github.com/kriasoft/universal-router/issues/new)
