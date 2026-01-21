# Declarative Routing

Universal Router supports a declarative approach where route configuration contains metadata
about what to render rather than imperative action functions. This pattern separates route
definitions from rendering logic, making routes more portable and easier to maintain.

## Understanding Declarative vs. Imperative Routing

**Imperative routing** embeds logic directly in routes:

```js
const routes = [
  {
    path: '/users/:id',
    action: async (context) => {
      const user = await fetchUser(context.params.id)
      return renderTemplate('user', { user })
    },
  },
]
```

**Declarative routing** separates what from how:

```js
const routes = [
  {
    path: '/users/:id',
    page: './pages/user',
    data: '/api/users/:id',
  },
]

// Rendering logic is centralized elsewhere
```

## Basic Declarative Setup

Define routes as pure data, then use `resolveRoute` to interpret them:

```ts
import UniversalRouter, { RouteContext, RouteParams } from 'universal-router'

// Declarative route definition
interface DeclarativeRoute {
  path: string
  page: string
  data?: string
  layout?: string
  meta?: {
    title?: string
    description?: string
    auth?: boolean
  }
}

const routes: DeclarativeRoute[] = [
  {
    path: '/',
    page: './pages/home',
    meta: { title: 'Home' },
  },
  {
    path: '/about',
    page: './pages/about',
    meta: { title: 'About Us' },
  },
  {
    path: '/users/:id',
    page: './pages/user',
    data: '/api/users/:id',
    meta: { title: 'User Profile', auth: true },
  },
]

// Result type returned from resolution
interface PageResult {
  component: React.ComponentType
  data: unknown
  meta: DeclarativeRoute['meta']
}

const router = new UniversalRouter<PageResult>(routes, {
  async resolveRoute(
    context: RouteContext<PageResult>,
    params: RouteParams,
  ): Promise<PageResult | undefined> {
    const route = context.route as unknown as DeclarativeRoute

    if (!route.page) {
      return undefined // Continue to children or next route
    }

    // Load page component dynamically
    const module = await import(route.page)
    const Component = module.default

    // Fetch data if specified
    let data = null
    if (route.data) {
      const dataUrl = interpolatePath(route.data, params)
      const response = await fetch(dataUrl)
      data = await response.json()
    }

    return {
      component: Component,
      data,
      meta: route.meta,
    }
  },
})

// Helper to replace :param with actual values
function interpolatePath(path: string, params: RouteParams): string {
  return path.replace(/:(\w+)/g, (_, key) => String(params[key] || ''))
}
```

## Client-Side Implementation

Full client-side implementation with code splitting and data fetching:

```ts
import UniversalRouter, { RouteContext, RouteParams } from 'universal-router'

interface DeclarativeRoute {
  path: string
  page?: string
  data?: string | ((params: RouteParams) => Promise<unknown>)
  children?: DeclarativeRoute[]
  meta?: {
    title?: string
    auth?: boolean
    roles?: string[]
  }
}

interface ResolvedPage {
  Component: React.ComponentType<{ data?: unknown }>
  data: unknown
  meta: DeclarativeRoute['meta']
}

const routes: DeclarativeRoute[] = [
  {
    path: '/',
    page: './pages/home',
    meta: { title: 'Home' },
  },
  {
    path: '/products',
    children: [
      {
        path: '',
        page: './pages/products',
        data: '/api/products',
        meta: { title: 'Products' },
      },
      {
        path: '/:productId',
        page: './pages/product',
        data: '/api/products/:productId',
        meta: { title: 'Product Details' },
      },
    ],
  },
  {
    path: '/admin',
    meta: { auth: true, roles: ['admin'] },
    children: [
      {
        path: '',
        page: './pages/admin/dashboard',
        meta: { title: 'Admin Dashboard' },
      },
      {
        path: '/users',
        page: './pages/admin/users',
        data: '/api/admin/users',
        meta: { title: 'Manage Users' },
      },
    ],
  },
]

const router = new UniversalRouter<ResolvedPage>(routes, {
  async resolveRoute(context, params) {
    const route = context.route as unknown as DeclarativeRoute

    // Check authentication
    if (route.meta?.auth) {
      const user = await getCurrentUser()
      if (!user) {
        throw { status: 401, redirect: '/login' }
      }
      if (route.meta.roles && !route.meta.roles.includes(user.role)) {
        throw { status: 403, message: 'Forbidden' }
      }
    }

    // If no page, continue to children
    if (!route.page) {
      return undefined
    }

    // Load page and data in parallel
    const [module, data] = await Promise.all([
      import(/* webpackChunkName: "[request]" */ route.page),
      fetchRouteData(route.data, params),
    ])

    return {
      Component: module.default,
      data,
      meta: route.meta,
    }
  },
})

async function fetchRouteData(
  dataConfig: DeclarativeRoute['data'],
  params: RouteParams,
): Promise<unknown> {
  if (!dataConfig) return null

  if (typeof dataConfig === 'function') {
    return dataConfig(params)
  }

  const url = dataConfig.replace(/:(\w+)/g, (_, key) =>
    String(params[key] || ''),
  )
  const response = await fetch(url)
  return response.json()
}
```

## Server-Side Implementation

On the server, load modules synchronously and render to HTML:

```ts
import express from 'express'
import UniversalRouter from 'universal-router'
import { renderToString } from 'react-dom/server'

interface DeclarativeRoute {
  path: string
  page?: string
  data?: string
  layout?: string
  meta?: { title?: string; description?: string }
}

const routes: DeclarativeRoute[] = [
  { path: '/', page: './pages/home', meta: { title: 'Home' } },
  { path: '/about', page: './pages/about', meta: { title: 'About' } },
  {
    path: '/posts/:id',
    page: './pages/post',
    data: '/api/posts/:id',
    meta: { title: 'Blog Post' },
  },
]

const router = new UniversalRouter<string>(routes, {
  async resolveRoute(context, params) {
    const route = context.route as unknown as DeclarativeRoute

    if (!route.page) return undefined

    // Server-side: require instead of dynamic import
    const Page = require(route.page).default

    // Fetch data
    let data = null
    if (route.data) {
      const url = route.data.replace(/:(\w+)/g, (_, k) => params[k] as string)
      data = await fetchServerSide(url)
    }

    // Render to HTML
    const html = renderToString(<Page data={data} params={params} />)
    const meta = route.meta || {}

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${meta.title || 'App'}</title>
          ${meta.description ? `<meta name="description" content="${meta.description}">` : ''}
          <script>window.__INITIAL_DATA__ = ${JSON.stringify(data)}</script>
        </head>
        <body>
          <div id="app">${html}</div>
          <script src="/bundle.js"></script>
        </body>
      </html>
    `
  },
})

const app = express()

app.get('*', async (req, res, next) => {
  try {
    const html = await router.resolve(req.path)
    res.send(html)
  } catch (error: any) {
    if (error.status === 404) {
      res.status(404).send('Not Found')
    } else {
      next(error)
    }
  }
})

app.listen(3000)
```

## Route Metadata Patterns

### Page Components

Define which component renders for each route:

```ts
interface Route {
  path: string
  page: string // Path to component module
  // OR
  component: React.ComponentType // Direct component reference
}
```

### Data Dependencies

Specify data requirements declaratively:

```ts
interface Route {
  path: string
  page: string

  // URL pattern for API endpoint
  data?: string

  // Or function for complex data fetching
  loader?: (params: RouteParams) => Promise<unknown>

  // Multiple data sources
  loaders?: {
    user: (params: RouteParams) => Promise<User>
    posts: (params: RouteParams) => Promise<Post[]>
  }
}
```

### Layout Configuration

Specify layouts per route:

```ts
interface Route {
  path: string
  page: string
  layout?: 'default' | 'fullWidth' | 'admin' | 'none'
  // Or nested layouts
  layouts?: string[] // ['root', 'admin', 'dashboard']
}
```

### Authorization Rules

Declare access requirements:

```ts
interface Route {
  path: string
  page: string
  meta?: {
    auth?: boolean | 'guest' | 'user' | 'admin'
    roles?: string[]
    permissions?: string[]
  }
}
```

## Complete Declarative Router

Here is a comprehensive implementation combining all patterns:

```ts
import UniversalRouter, { RouteContext, RouteParams } from 'universal-router'

// Route definition types
interface RouteMeta {
  title?: string
  description?: string
  canonical?: string
  robots?: string
}

interface RouteAuth {
  required?: boolean
  roles?: string[]
  permissions?: string[]
  redirectTo?: string
}

interface DeclarativeRoute {
  path: string
  name?: string
  page?: string
  data?: string | DataLoader
  layout?: string
  meta?: RouteMeta
  auth?: RouteAuth
  children?: DeclarativeRoute[]
}

type DataLoader = (params: RouteParams, context: AppContext) => Promise<unknown>

interface AppContext {
  user: User | null
  locale: string
}

interface ResolvedPage {
  Component: React.ComponentType<{ data?: unknown }>
  Layout: React.ComponentType<{ children: React.ReactNode }>
  data: unknown
  meta: RouteMeta
}

// Layout registry
const layouts: Record<string, React.ComponentType<{ children: React.ReactNode }>> = {
  default: DefaultLayout,
  admin: AdminLayout,
  fullWidth: FullWidthLayout,
  none: ({ children }) => <>{children}</>,
}

// Route definitions
const routes: DeclarativeRoute[] = [
  {
    path: '/',
    page: './pages/home',
    layout: 'default',
    meta: { title: 'Welcome' },
  },
  {
    path: '/dashboard',
    layout: 'admin',
    auth: { required: true },
    children: [
      {
        path: '',
        page: './pages/dashboard',
        meta: { title: 'Dashboard' },
      },
      {
        path: '/analytics',
        page: './pages/analytics',
        data: async (params, context) => {
          return fetchAnalytics(context.user!.id)
        },
        meta: { title: 'Analytics' },
        auth: { permissions: ['analytics:view'] },
      },
    ],
  },
  {
    path: '/posts/:id',
    page: './pages/post',
    data: '/api/posts/:id',
    layout: 'default',
    meta: { title: 'Blog Post' },
  },
]

// Create router
function createDeclarativeRouter(appContext: AppContext) {
  return new UniversalRouter<ResolvedPage>(routes, {
    context: appContext,

    async resolveRoute(context, params) {
      const route = context.route as unknown as DeclarativeRoute

      // Authorization check
      if (route.auth?.required && !appContext.user) {
        throw {
          status: 401,
          redirect: route.auth.redirectTo || '/login',
        }
      }

      if (route.auth?.roles?.length) {
        const hasRole = route.auth.roles.some((r) =>
          appContext.user?.roles.includes(r)
        )
        if (!hasRole) {
          throw { status: 403, message: 'Forbidden' }
        }
      }

      if (route.auth?.permissions?.length) {
        const hasPermission = route.auth.permissions.every((p) =>
          appContext.user?.permissions.includes(p)
        )
        if (!hasPermission) {
          throw { status: 403, message: 'Insufficient permissions' }
        }
      }

      // No page means this is a layout wrapper - continue to children
      if (!route.page) {
        return undefined
      }

      // Load component and data in parallel
      const [module, data] = await Promise.all([
        import(route.page),
        loadRouteData(route.data, params, appContext),
      ])

      return {
        Component: module.default,
        Layout: layouts[route.layout || 'default'],
        data,
        meta: route.meta || {},
      }
    },

    errorHandler(error, context) {
      if (error.redirect) {
        return {
          Component: () => null,
          Layout: layouts.none,
          data: null,
          meta: {},
          redirect: error.redirect,
        } as ResolvedPage & { redirect: string }
      }

      return {
        Component: ErrorPage,
        Layout: layouts.default,
        data: { error },
        meta: { title: 'Error' },
      }
    },
  })
}

async function loadRouteData(
  dataConfig: DeclarativeRoute['data'],
  params: RouteParams,
  context: AppContext
): Promise<unknown> {
  if (!dataConfig) return null

  if (typeof dataConfig === 'function') {
    return dataConfig(params, context)
  }

  // URL pattern - interpolate params
  const url = dataConfig.replace(/:(\w+)/g, (_, key) => String(params[key] || ''))
  const response = await fetch(url)
  return response.json()
}

// Usage
const router = createDeclarativeRouter({
  user: currentUser,
  locale: 'en',
})

const result = await router.resolve('/dashboard/analytics')
```

## React Integration

Render declarative routes in React:

```tsx
import { useState, useEffect } from 'react'

function App() {
  const [page, setPage] = useState<ResolvedPage | null>(null)
  const [loading, setLoading] = useState(true)

  async function navigate(pathname: string) {
    setLoading(true)
    try {
      const result = await router.resolve(pathname)

      // Handle redirects
      if ('redirect' in result) {
        window.history.replaceState(null, '', result.redirect)
        return navigate(result.redirect)
      }

      setPage(result)

      // Update document meta
      if (result.meta.title) {
        document.title = result.meta.title
      }
    } catch (error) {
      console.error('Navigation error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    navigate(window.location.pathname)

    const handlePopState = () => navigate(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (loading || !page) {
    return <LoadingSpinner />
  }

  const { Component, Layout, data } = page

  return (
    <Layout>
      <Component data={data} />
    </Layout>
  )
}
```

## Benefits of Declarative Routing

1. **Separation of concerns**: Route configuration is separate from rendering logic
2. **Portability**: Routes can be serialized, stored, or generated dynamically
3. **Testability**: Routes are pure data, easy to test
4. **Code splitting**: Dynamic imports based on route configuration
5. **Consistency**: Centralized handling of auth, data loading, layouts
6. **Documentation**: Routes serve as documentation for available pages

## Common Pitfalls

### 1. Not Returning Undefined for Parent Routes

Parent routes without a page should return `undefined` to continue matching:

```ts
// Wrong - returns value, stops matching
{
  resolveRoute(context) {
    const route = context.route
    if (!route.page) {
      return null // Stops matching!
    }
  }
}

// Correct - returns undefined to continue
{
  resolveRoute(context) {
    const route = context.route
    if (!route.page) {
      return undefined // Continues to children
    }
  }
}
```

### 2. Blocking Data Fetches

Load data in parallel with components:

```ts
// Slow - sequential loading
const module = await import(route.page)
const data = await fetchData(route.data)

// Fast - parallel loading
const [module, data] = await Promise.all([
  import(route.page),
  fetchData(route.data),
])
```

### 3. Missing Error Boundaries

Always handle errors gracefully:

```ts
const router = new UniversalRouter(routes, {
  errorHandler(error, context) {
    // Return error page instead of throwing
    return {
      Component: ErrorPage,
      data: { error },
      meta: { title: 'Error' },
    }
  },
})
```

## See Also

- [Code Splitting](./code-splitting.md) - Dynamic imports for route components
- [Authorization](./authorization.md) - Route-based access control
- [Isomorphic Routing](./isomorphic-routing.md) - Server and client rendering
- [Universal Router API](./api.md) - Complete API reference
