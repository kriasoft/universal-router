# Redirects

The easiest way to add a redirect to your route is to return from the action method something
that you can interpret as a redirect at the end of routes resolving, for example:

```js
import UniversalRouter from 'universal-router'

const router = new UniversalRouter([
  {
    path: '/redirect',
    action() {
      return { redirect: '/target' } // <== request a redirect
    },
  },
  {
    path: '/target',
    action() {
      return { content: '<h1>Content</h1>' }
    },
  },
])

router.resolve('/redirect').then(page => {
  if (page.redirect) {
    window.location = page.redirect // <== actual redirect here
  } else {
    document.body.innerHTML = page.content
  }
})
```

The most common use case of redirects is to redirect to the login page for authorization-protected pages:

```js
const router = new UniversalRouter([
  {
    path: '/login',
    action() {
      return { content: '<h1>Login</h1>' }
    },
  },
  {
    path: '/admin',
    action(context) {
      if (!context.user) {
        return { redirect: '/login' }
      }
      return { content: '<h1>Admin</h1>' }
    },
  },
])

router.resolve({
  pathname: '/admin',
  user: null, // <== is the user logged in?
}).then(page => {
  if (page.redirect) {
    window.location = page.redirect
  } else {
    document.body.innerHTML = page.content
  }
})
```

You also can use [middleware](https://github.com/kriasoft/universal-router/blob/master/docs/api.md#middlewares)
approach to protect a bunch of routes:

```js
const adminRoutes = {
  path: '/admin',
  action(context) {
    if (!context.user) {
      return { redirect: '/login' } // stop and redirect
    }
    return context.next() // go to children
  },
  children: [
    { path: '',       action: () => ({ content: '<h1>Admin: Home</h1>'  }) },
    { path: '/users', action: () => ({ content: '<h1>Admin: Users</h1>' }) },
    { path: '/posts', action: () => ({ content: '<h1>Admin: Posts</h1>' }) },
  ],
}
```

In case if you prefer [declarative](https://en.wikipedia.org/wiki/Declarative_programming) routing:

```js
const routes = [
  { path: '/login', content: '<h1>Login</h1>' },
  {
    path: '/admin',
    protected: true, // <== protect current and all child routes
    children: [
      { path: '',       content: '<h1>Admin: Home</h1>'  },
      { path: '/users', content: '<h1>Admin: Users</h1>' },
      { path: '/posts', content: '<h1>Admin: Posts</h1>' },
    ],
  },
]

const router = new UniversalRouter(routes, {
  resolveRoute(context, params) {
    if (context.route.protected && !context.user) {
      return { redirect: '/login', from: context.pathname } // <== where the redirect come from?
    }
    if (context.route.content) {
      return { content: context.route.content }
    }
    return null
  },
})

router.resolve({ pathname: '/admin/users', user: null }).then(page => {
  if (page.redirect) {
    console.log(`Redirect from ${page.from} to ${page.redirect}`)
    window.location = page.redirect
  } else {
    document.body.innerHTML = page.content
  }
})
```

For client side redirects without a full page reload you may use the browser
[History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
(or libraries like [history](https://github.com/ReactTraining/history)):

```js
router.resolve('/redirect').then(page => {
  if (page.redirect) {
    const state = { from: page.from }
    window.history.pushState(state, '', page.redirect)
  } else {
    document.body.innerHTML = page.content
  }
})
```

For server side redirect you need to respond with
[3xx http status code](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes#3xx_Redirection) and a new location:

```js
import http from 'http'
import url from 'url'

const server = http.createServer(async (req, res) => {
  const location = url.parse(req.url)
  const page = await router.resolve(location.pathname)

  if (page.redirect) {
    res.writeHead(301, { Location: page.redirect })
    res.end()
  } else {
    res.write(`<!doctype html>${page.content}`)
    res.end()
  }
})

server.listen(8080)
```

Playground: [JSFiddle](https://jsfiddle.net/frenzzy/2nq9o896/)

## Learn more

* [Universal Router API](https://github.com/kriasoft/universal-router/blob/master/docs/api.md)
