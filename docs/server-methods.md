# Handling HTTP Methods (GET, POST, PUT, DELETE)

Universal Router is a path-based router that does not include built-in HTTP method handling.
This is by design - it keeps the core library lightweight and allows you to implement
method-aware routing in a way that fits your specific use case.

This guide shows how to implement HTTP method handling for REST APIs, server-side
applications, and hybrid setups.

## Why Universal Router Doesn't Include Method Handling

Universal Router focuses on URL path matching and can run in any JavaScript environment
(browser, Node.js, workers, etc.). HTTP methods are only relevant in server contexts,
so method handling is left as an implementation detail:

```
Browser: Only uses GET (navigation) - no method handling needed
Server:  Full REST API - needs method handling
Worker:  Can be either - depends on use case
```

This approach keeps the router versatile and allows you to implement exactly what you need.

## Basic Method Handling with Custom Resolver

The most straightforward approach uses a custom `resolveRoute` function:

```ts
import UniversalRouter from 'universal-router'
import type { Route, RouteContext, RouteParams } from 'universal-router'

// Extend Route to include method handlers
interface MethodRoute extends Route {
  get?: (context: RouteContext, params: RouteParams) => any
  post?: (context: RouteContext, params: RouteParams) => any
  put?: (context: RouteContext, params: RouteParams) => any
  patch?: (context: RouteContext, params: RouteParams) => any
  delete?: (context: RouteContext, params: RouteParams) => any
}

// Define routes with method handlers
const routes: MethodRoute[] = [
  {
    path: '/api/users',
    get: async (ctx) => {
      const users = await db.users.findAll()
      return { status: 200, body: users }
    },
    post: async (ctx) => {
      const user = await db.users.create(ctx.body)
      return { status: 201, body: user }
    },
  },
  {
    path: '/api/users/:id',
    get: async (ctx, params) => {
      const user = await db.users.findById(params.id)
      if (!user) return { status: 404, body: { error: 'Not found' } }
      return { status: 200, body: user }
    },
    put: async (ctx, params) => {
      const user = await db.users.update(params.id, ctx.body)
      return { status: 200, body: user }
    },
    delete: async (ctx, params) => {
      await db.users.delete(params.id)
      return { status: 204, body: null }
    },
  },
]

const router = new UniversalRouter(routes, {
  resolveRoute(context, params) {
    const route = context.route as MethodRoute
    const method = context.method?.toLowerCase()

    // Check for method-specific handler
    if (method && route[method as keyof MethodRoute]) {
      const handler = route[method as keyof MethodRoute]
      if (typeof handler === 'function') {
        return handler(context, params)
      }
    }

    // Fall back to generic action
    if (typeof route.action === 'function') {
      return route.action(context, params)
    }

    return undefined
  },
})
```

## Using with Express

Integrate Universal Router as middleware in Express applications:

```ts
import express from 'express'
import UniversalRouter from 'universal-router'

const app = express()
app.use(express.json())

interface ApiResponse {
  status: number
  body: unknown
  headers?: Record<string, string>
}

interface MethodRoute {
  path: string
  methods?: {
    get?: (context: any) => Promise<ApiResponse>
    post?: (context: any) => Promise<ApiResponse>
    put?: (context: any) => Promise<ApiResponse>
    delete?: (context: any) => Promise<ApiResponse>
  }
  children?: MethodRoute[]
}

const routes: MethodRoute[] = [
  {
    path: '/api',
    children: [
      {
        path: '/users',
        methods: {
          get: async () => ({
            status: 200,
            body: await db.users.findAll(),
          }),
          post: async (ctx) => ({
            status: 201,
            body: await db.users.create(ctx.body),
          }),
        },
      },
      {
        path: '/users/:id',
        methods: {
          get: async (ctx) => {
            const user = await db.users.findById(ctx.params.id)
            return user
              ? { status: 200, body: user }
              : { status: 404, body: { error: 'User not found' } }
          },
          put: async (ctx) => ({
            status: 200,
            body: await db.users.update(ctx.params.id, ctx.body),
          }),
          delete: async (ctx) => {
            await db.users.delete(ctx.params.id)
            return { status: 204, body: null }
          },
        },
      },
    ],
  },
]

const router = new UniversalRouter<ApiResponse>(routes, {
  resolveRoute(context, params) {
    const route = context.route as unknown as MethodRoute
    const method = context.method?.toLowerCase() as keyof MethodRoute['methods']

    if (route.methods && route.methods[method]) {
      return route.methods[method]!(context)
    }

    return undefined
  },
})

// Express middleware
app.use('/api/*', async (req, res, next) => {
  try {
    const result = await router.resolve({
      pathname: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
      headers: req.headers,
    })

    if (result) {
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          res.setHeader(key, value)
        })
      }
      res.status(result.status).json(result.body)
    } else {
      next()
    }
  } catch (error: any) {
    if (error.status === 404) {
      res.status(404).json({ error: 'Not found' })
    } else {
      next(error)
    }
  }
})

app.listen(3000)
```

## Using with Koa

Similar integration for Koa applications:

```ts
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import UniversalRouter from 'universal-router'

const app = new Koa()
app.use(bodyParser())

interface ApiResponse {
  status: number
  body: unknown
}

interface MethodRoute {
  path: string
  methods?: Record<string, (context: any) => Promise<ApiResponse>>
  children?: MethodRoute[]
}

const routes: MethodRoute[] = [
  {
    path: '/api/posts',
    methods: {
      get: async () => ({
        status: 200,
        body: await db.posts.findAll(),
      }),
      post: async (ctx) => ({
        status: 201,
        body: await db.posts.create(ctx.body),
      }),
    },
  },
  {
    path: '/api/posts/:id',
    methods: {
      get: async (ctx) => {
        const post = await db.posts.findById(ctx.params.id)
        return post
          ? { status: 200, body: post }
          : { status: 404, body: { error: 'Not found' } }
      },
      put: async (ctx) => ({
        status: 200,
        body: await db.posts.update(ctx.params.id, ctx.body),
      }),
      delete: async (ctx) => {
        await db.posts.delete(ctx.params.id)
        return { status: 204, body: null }
      },
    },
  },
]

const router = new UniversalRouter<ApiResponse>(routes, {
  resolveRoute(context, params) {
    const route = context.route as unknown as MethodRoute
    const method = context.method?.toLowerCase()

    if (route.methods && method && route.methods[method]) {
      return route.methods[method](context)
    }

    return undefined
  },
})

// Koa middleware
app.use(async (ctx, next) => {
  try {
    const result = await router.resolve({
      pathname: ctx.path,
      method: ctx.method,
      body: ctx.request.body,
      query: ctx.query,
    })

    if (result) {
      ctx.status = result.status
      ctx.body = result.body
    } else {
      await next()
    }
  } catch (error: any) {
    if (error.status === 404) {
      ctx.status = 404
      ctx.body = { error: 'Not found' }
    } else {
      throw error
    }
  }
})

app.listen(3000)
```

## Method Not Allowed (405) Responses

Properly return 405 when a route exists but doesn't support the requested method:

```ts
interface MethodRoute {
  path: string
  methods?: Record<string, (context: any) => Promise<any>>
  children?: MethodRoute[]
}

const router = new UniversalRouter<ApiResponse>(routes, {
  resolveRoute(context, params) {
    const route = context.route as unknown as MethodRoute
    const method = context.method?.toLowerCase()

    if (route.methods) {
      // Route has method handlers defined
      if (method && route.methods[method]) {
        return route.methods[method](context)
      }

      // Route matched but method not supported - return 405
      const allowedMethods = Object.keys(route.methods)
        .map((m) => m.toUpperCase())
        .join(', ')

      return {
        status: 405,
        body: { error: 'Method not allowed' },
        headers: { Allow: allowedMethods },
      }
    }

    return undefined
  },
})
```

## RESTful Resource Pattern

Create a helper function for defining RESTful resources:

```ts
import UniversalRouter from 'universal-router'

interface ResourceHandlers<T> {
  list?: () => Promise<T[]>
  create?: (data: Partial<T>) => Promise<T>
  get?: (id: string) => Promise<T | null>
  update?: (id: string, data: Partial<T>) => Promise<T>
  delete?: (id: string) => Promise<void>
}

interface ApiResponse {
  status: number
  body: unknown
  headers?: Record<string, string>
}

function createResource<T>(
  basePath: string,
  handlers: ResourceHandlers<T>,
): any[] {
  const routes: any[] = []

  // Collection routes: /resource
  const collectionMethods: Record<string, any> = {}

  if (handlers.list) {
    collectionMethods.get = async () => ({
      status: 200,
      body: await handlers.list!(),
    })
  }

  if (handlers.create) {
    collectionMethods.post = async (ctx: any) => ({
      status: 201,
      body: await handlers.create!(ctx.body),
    })
  }

  if (Object.keys(collectionMethods).length > 0) {
    routes.push({
      path: basePath,
      methods: collectionMethods,
    })
  }

  // Individual resource routes: /resource/:id
  const itemMethods: Record<string, any> = {}

  if (handlers.get) {
    itemMethods.get = async (ctx: any) => {
      const item = await handlers.get!(ctx.params.id)
      return item
        ? { status: 200, body: item }
        : { status: 404, body: { error: 'Not found' } }
    }
  }

  if (handlers.update) {
    itemMethods.put = async (ctx: any) => ({
      status: 200,
      body: await handlers.update!(ctx.params.id, ctx.body),
    })
  }

  if (handlers.delete) {
    itemMethods.delete = async (ctx: any) => {
      await handlers.delete!(ctx.params.id)
      return { status: 204, body: null }
    }
  }

  if (Object.keys(itemMethods).length > 0) {
    routes.push({
      path: `${basePath}/:id`,
      methods: itemMethods,
    })
  }

  return routes
}

// Usage
const userRoutes = createResource('/api/users', {
  list: () => db.users.findAll(),
  create: (data) => db.users.create(data),
  get: (id) => db.users.findById(id),
  update: (id, data) => db.users.update(id, data),
  delete: (id) => db.users.delete(id),
})

const postRoutes = createResource('/api/posts', {
  list: () => db.posts.findAll(),
  create: (data) => db.posts.create(data),
  get: (id) => db.posts.findById(id),
  update: (id, data) => db.posts.update(id, data),
  delete: (id) => db.posts.delete(id),
})

const router = new UniversalRouter<ApiResponse>(
  [...userRoutes, ...postRoutes],
  {
    resolveRoute(context, params) {
      const route = context.route as any
      const method = context.method?.toLowerCase()

      if (route.methods && method && route.methods[method]) {
        return route.methods[method](context)
      }

      return undefined
    },
  },
)
```

## Nested Resources

Handle nested REST resources like `/users/:userId/posts/:postId`:

```ts
const routes = [
  {
    path: '/api/users/:userId',
    children: [
      {
        path: '/posts',
        methods: {
          get: async (ctx: any) => ({
            status: 200,
            body: await db.posts.findByUser(ctx.params.userId),
          }),
          post: async (ctx: any) => ({
            status: 201,
            body: await db.posts.create({
              ...ctx.body,
              userId: ctx.params.userId,
            }),
          }),
        },
      },
      {
        path: '/posts/:postId',
        methods: {
          get: async (ctx: any) => {
            const post = await db.posts.findByUserAndId(
              ctx.params.userId,
              ctx.params.postId,
            )
            return post
              ? { status: 200, body: post }
              : { status: 404, body: { error: 'Post not found' } }
          },
          put: async (ctx: any) => ({
            status: 200,
            body: await db.posts.update(ctx.params.postId, ctx.body),
          }),
          delete: async (ctx: any) => {
            await db.posts.delete(ctx.params.postId)
            return { status: 204, body: null }
          },
        },
      },
    ],
  },
]
```

## TypeScript Types for Method Routes

Create proper TypeScript types for method-aware routes:

```ts
import type { RouteContext, RouteParams, Route } from 'universal-router'

// HTTP methods
type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  | 'head'
  | 'options'

// Response type
interface ApiResponse<T = unknown> {
  status: number
  body: T
  headers?: Record<string, string>
}

// Handler function type
type MethodHandler<T = unknown, C = {}> = (
  context: RouteContext & C,
  params: RouteParams,
) => Promise<ApiResponse<T>> | ApiResponse<T>

// Route with method handlers
interface MethodRoute<C = {}> extends Omit<Route, 'action' | 'children'> {
  methods?: Partial<Record<HttpMethod, MethodHandler<unknown, C>>>
  children?: MethodRoute<C>[]
}

// Context with HTTP-specific properties
interface HttpContext {
  method: string
  body?: unknown
  query?: Record<string, string | string[]>
  headers?: Record<string, string>
}

// Create typed router
function createHttpRouter<C extends HttpContext>(routes: MethodRoute<C>[]) {
  return new UniversalRouter<ApiResponse, C>(routes as Route[], {
    resolveRoute(context, params) {
      const route = context.route as unknown as MethodRoute<C>
      const method = context.method?.toLowerCase() as HttpMethod

      if (route.methods && route.methods[method]) {
        return route.methods[method]!(context, params)
      }

      // Return 405 if route has methods but not this one
      if (route.methods && Object.keys(route.methods).length > 0) {
        const allowed = Object.keys(route.methods)
          .map((m) => m.toUpperCase())
          .join(', ')
        return {
          status: 405,
          body: { error: 'Method not allowed' },
          headers: { Allow: allowed },
        }
      }

      return undefined
    },
  })
}

// Usage with full type safety
const router = createHttpRouter<HttpContext>([
  {
    path: '/api/users',
    methods: {
      get: async () => ({
        status: 200,
        body: await db.users.findAll(),
      }),
      post: async (ctx) => ({
        status: 201,
        body: await db.users.create(ctx.body as any),
      }),
    },
  },
])
```

## Common Pitfalls

### 1. Forgetting to Pass Method to Context

Always include the HTTP method when resolving:

```ts
// Wrong - method not passed
const result = await router.resolve(req.path)

// Correct - include method
const result = await router.resolve({
  pathname: req.path,
  method: req.method,
  body: req.body,
})
```

### 2. Case Sensitivity

HTTP methods from Express/Koa are uppercase, but your handlers might expect lowercase:

```ts
// Normalize method case in resolver
const method = context.method?.toLowerCase()
```

### 3. Not Handling OPTIONS for CORS

Remember to handle OPTIONS requests for CORS preflight:

```ts
const routes = [
  {
    path: '/api/users',
    methods: {
      options: async () => ({
        status: 204,
        body: null,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }),
      get: async () => ({ status: 200, body: await db.users.findAll() }),
      post: async (ctx) => ({
        status: 201,
        body: await db.users.create(ctx.body),
      }),
    },
  },
]
```

### 4. Mixing Route-Level and Method-Level Handlers

Be consistent about where logic lives:

```ts
// Confusing - mixing action and methods
{
  path: '/api/users',
  action: () => { /* ... */ },  // When is this called?
  methods: {
    get: () => { /* ... */ },
  },
}

// Clear - methods only
{
  path: '/api/users',
  methods: {
    get: () => { /* ... */ },
    post: () => { /* ... */ },
  },
}
```

## See Also

- [Authorization](./authorization.md) - Protecting API routes
- [API Reference](./api.md) - Complete router API
- [Nested Routes](./nested-routes.md) - Organizing route hierarchies
- [TypeScript Guide](./typescript.md) - Type-safe routing
