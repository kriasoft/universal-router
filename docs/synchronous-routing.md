# Synchronous Routing Mode

Universal Router provides a synchronous variant, `UniversalRouterSync`, for use cases
where async operations are not needed. This can simplify code, improve performance,
and is required when integrating with APIs that expect synchronous responses.

## Why Use Synchronous Routing?

The async `UniversalRouter` wraps all operations in Promises, even when your route
actions are synchronous. While this provides flexibility, it has overhead:

```ts
// Async router always returns a Promise
const router = new UniversalRouter(routes)
const result = await router.resolve('/') // Must await

// Sync router returns immediately
const routerSync = new UniversalRouterSync(routes)
const result = routerSync.resolve('/') // Direct value
```

Use `UniversalRouterSync` when:

- All your route actions are synchronous
- You're integrating with sync-only APIs
- You want to avoid Promise overhead
- You need predictable execution timing

## Basic Usage

Import `UniversalRouterSync` from the dedicated module:

```ts
import UniversalRouterSync from 'universal-router/sync'

const routes = [
  {
    path: '/',
    action: () => 'Home Page',
  },
  {
    path: '/about',
    action: () => 'About Page',
  },
  {
    path: '/users/:id',
    action: (context, params) => `User ${params.id}`,
  },
]

const router = new UniversalRouterSync(routes)

// Returns value directly - no await needed
const result = router.resolve('/users/123')
console.log(result) // 'User 123'
```

## API Comparison

The sync router has the same API as the async version, but returns values directly:

```ts
// Async version
import UniversalRouter from 'universal-router'

const asyncRouter = new UniversalRouter(routes, options)
const result = await asyncRouter.resolve(pathname) // Promise<R>

// Sync version
import UniversalRouterSync from 'universal-router/sync'

const syncRouter = new UniversalRouterSync(routes, options)
const result = syncRouter.resolve(pathname) // R (direct value)
```

### Route Action Return Types

```ts
// Async route actions can return promises
const asyncRoutes = [
  {
    path: '/data',
    async action() {
      const data = await fetchData()
      return data
    },
  },
]

// Sync route actions must return values directly
const syncRoutes = [
  {
    path: '/data',
    action() {
      // Cannot use async/await here
      return getCachedData()
    },
  },
]
```

## TypeScript Types

The sync router exports its own types:

```ts
import UniversalRouterSync, {
  RouteContext,
  Route,
  Routes,
  RouterOptions,
  RouteResultSync,
} from 'universal-router/sync'

// Define typed routes
const routes: Routes<string> = [
  {
    path: '/',
    action: () => 'Home',
  },
  {
    path: '/users/:id',
    action: (context: RouteContext<string>, params) => {
      return `User ${params.id}`
    },
  },
]

const router = new UniversalRouterSync<string>(routes)
```

### Route Result Type

The sync version uses `RouteResultSync<T>` instead of `RouteResult<T>`:

```ts
// Async: can be T, null, undefined, or Promise
type RouteResult<T> = T | null | undefined | Promise<T | null | undefined>

// Sync: no Promise allowed
type RouteResultSync<T> = T | null | undefined
```

## Error Handling

Error handling works the same as the async version, but errors are thrown
synchronously:

```ts
import UniversalRouterSync from 'universal-router/sync'

const routes = [{ path: '/', action: () => 'Home' }]

const router = new UniversalRouterSync(routes)

// Try/catch works directly
try {
  const result = router.resolve('/not-found')
} catch (error) {
  if (error.status === 404) {
    console.log('Page not found')
  }
}
```

### Error Handler Option

```ts
const router = new UniversalRouterSync(routes, {
  errorHandler(error, context) {
    if (error.status === 404) {
      return 'Page Not Found'
    }
    throw error // Re-throw other errors
  },
})

// No try/catch needed for 404s
const result = router.resolve('/not-found') // 'Page Not Found'
```

## Use Cases

### Server-Side Rendering with Streaming

Some SSR frameworks require synchronous route resolution:

```ts
import UniversalRouterSync from 'universal-router/sync'
import { renderToString } from 'react-dom/server'

const routes = [
  { path: '/', action: () => <HomePage /> },
  { path: '/about', action: () => <AboutPage /> },
]

const router = new UniversalRouterSync(routes)

function handleRequest(req, res) {
  const component = router.resolve(req.path)
  const html = renderToString(component)
  res.send(html)
}
```

### State Management Integration

Redux reducers must be synchronous:

```ts
import UniversalRouterSync from 'universal-router/sync'

const routes = [
  { path: '/', action: () => ({ page: 'home' }) },
  { path: '/about', action: () => ({ page: 'about' }) },
  {
    path: '/users/:id',
    action: (ctx, params) => ({
      page: 'user',
      userId: params.id,
    }),
  },
]

const router = new UniversalRouterSync(routes)

// Redux reducer
function routeReducer(state = {}, action) {
  switch (action.type) {
    case 'NAVIGATE':
      // Sync resolution inside reducer
      return router.resolve(action.pathname)
    default:
      return state
  }
}
```

### Testing

Sync routing simplifies testing by avoiding async/await:

```ts
import UniversalRouterSync from 'universal-router/sync'

describe('Router', () => {
  const routes = [
    { path: '/', action: () => 'home' },
    { path: '/users/:id', action: (ctx, params) => `user-${params.id}` },
  ]

  const router = new UniversalRouterSync(routes)

  it('resolves home route', () => {
    // No async/await needed
    expect(router.resolve('/')).toBe('home')
  })

  it('resolves parameterized route', () => {
    expect(router.resolve('/users/123')).toBe('user-123')
  })

  it('throws on unknown route', () => {
    expect(() => router.resolve('/unknown')).toThrow()
  })
})
```

### CLI Tools

Command-line tools often work better with synchronous code:

```ts
#!/usr/bin/env node
import UniversalRouterSync from 'universal-router/sync'

const commands = [
  {
    path: '/help',
    action: () => 'Usage: cli <command>',
  },
  {
    path: '/version',
    action: () => '1.0.0',
  },
  {
    path: '/greet/:name',
    action: (ctx, params) => `Hello, ${params.name}!`,
  },
]

const router = new UniversalRouterSync(commands, {
  errorHandler: () => 'Unknown command. Try "cli help"',
})

// Parse command from argv
const command = '/' + process.argv.slice(2).join('/')
const output = router.resolve(command)
console.log(output)
```

### Performance-Critical Paths

When route resolution is in a hot path:

```ts
import UniversalRouterSync from 'universal-router/sync'

const routes = [
  { path: '/api/health', action: () => ({ status: 'ok' }) },
  { path: '/api/metrics', action: () => getMetrics() },
]

const router = new UniversalRouterSync(routes)

// Called thousands of times per second
function handleRequest(path: string) {
  // No Promise overhead
  return router.resolve(path)
}
```

## Custom Context

Pass custom context data just like the async version:

```ts
import UniversalRouterSync from 'universal-router/sync'

interface AppContext {
  user: { id: string; role: string } | null
  config: { debug: boolean }
}

const routes = [
  {
    path: '/admin',
    action(context) {
      if (!context.user || context.user.role !== 'admin') {
        return 'Access denied'
      }
      return 'Admin panel'
    },
  },
  {
    path: '/debug',
    action(context) {
      if (!context.config.debug) {
        return 'Debug mode disabled'
      }
      return 'Debug info...'
    },
  },
]

const router = new UniversalRouterSync<string, AppContext>(routes, {
  context: {
    user: null,
    config: { debug: false },
  },
})

// Override context per request
const result = router.resolve({
  pathname: '/admin',
  user: { id: '1', role: 'admin' },
  config: { debug: true },
})
```

## Nested Routes and next()

The `next()` function works synchronously:

```ts
import UniversalRouterSync from 'universal-router/sync'

const routes = [
  {
    path: '/users',
    action(context) {
      console.log('Users middleware')
      // Continue to children
      return context.next()
    },
    children: [
      {
        path: '/:id',
        action(context, params) {
          return `User ${params.id}`
        },
      },
    ],
  },
]

const router = new UniversalRouterSync(routes)

// Logs 'Users middleware' then returns 'User 123'
const result = router.resolve('/users/123')
```

## Migrating from Async to Sync

If your routes don't use async operations, migrating is straightforward:

```ts
// Before: async router
import UniversalRouter from 'universal-router'

const routes = [
  { path: '/', action: () => 'Home' },
  { path: '/about', action: () => 'About' },
]

const router = new UniversalRouter(routes)

async function handleRoute(path: string) {
  const result = await router.resolve(path)
  return result
}

// After: sync router
import UniversalRouterSync from 'universal-router/sync'

const routes = [
  { path: '/', action: () => 'Home' },
  { path: '/about', action: () => 'About' },
]

const router = new UniversalRouterSync(routes)

function handleRoute(path: string) {
  return router.resolve(path)
}
```

### What Changes

| Aspect             | Async                   | Sync                      |
| ------------------ | ----------------------- | ------------------------- |
| Import             | `'universal-router'`    | `'universal-router/sync'` |
| `resolve()` return | `Promise<R>`            | `R`                       |
| Route actions      | Can be async            | Must be sync              |
| Error handling     | `.catch()` or try/await | try/catch                 |
| `next()` return    | `Promise<R>`            | `R`                       |

## Common Pitfalls

### 1. Using Async Actions

Sync router doesn't work with async actions:

```ts
// Wrong - will not work as expected
const routes = [
  {
    path: '/data',
    async action() {
      return await fetchData() // Returns a Promise, not data
    },
  },
]

const router = new UniversalRouterSync(routes)
const result = router.resolve('/data') // result is a Promise!

// Correct - use pre-fetched or cached data
const routes = [
  {
    path: '/data',
    action() {
      return getCachedData() // Returns data directly
    },
  },
]
```

### 2. Mixing Sync and Async Routes

If some routes need async, use the async router:

```ts
// If ANY route needs async, use async router
const routes = [
  { path: '/', action: () => 'Home' }, // sync
  {
    path: '/data',
    async action() {
      // async
      return await fetchData()
    },
  },
]

// Must use async router
import UniversalRouter from 'universal-router'
const router = new UniversalRouter(routes)
```

### 3. Wrong Import Path

Make sure to import from the correct path:

```ts
// Wrong - this is the async router
import UniversalRouterSync from 'universal-router'

// Correct
import UniversalRouterSync from 'universal-router/sync'
```

### 4. Expecting Promises

Don't wrap sync results in Promise handling:

```ts
const router = new UniversalRouterSync(routes)

// Wrong - unnecessary Promise handling
router.resolve('/').then((result) => {
  console.log(result)
})

// Correct - direct value
const result = router.resolve('/')
console.log(result)
```

## See Also

- [API Reference](./api.md) - Complete API documentation
- [TypeScript Guide](./typescript.md) - Type-safe routing
- [Getting Started](./getting-started.md) - Basic setup
- [Nested Routes](./nested-routes.md) - Route hierarchies
