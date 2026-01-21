# TypeScript Integration and Type-Safe Routes

Universal Router provides comprehensive TypeScript support with automatic parameter inference,
type-safe URL generation, and customizable context types. This guide covers everything from
basic setup to advanced type patterns.

## Quick Start

Install Universal Router with TypeScript:

```bash
npm install universal-router
```

Basic typed usage:

```ts
import UniversalRouter from 'universal-router'

const routes = [
  { path: '/', action: () => 'Home' },
  { path: '/users/:id', action: (ctx) => `User ${ctx.params.id}` },
] as const

const router = new UniversalRouter(routes)
const result = await router.resolve('/users/123') // result is string
```

## ExtractParams - Automatic Parameter Type Inference

The `ExtractParams` utility type extracts parameter types directly from path strings:

```ts
import type { ExtractParams } from 'universal-router'

// Basic parameter extraction
type UserParams = ExtractParams<'/users/:id'>
// { id: string }

type PostParams = ExtractParams<'/users/:userId/posts/:postId'>
// { userId: string; postId: string }

// Wildcard parameters become string arrays
type FileParams = ExtractParams<'/files/*path'>
// { path: string[] }

// Combined parameters
type ComplexParams = ExtractParams<'/orgs/:orgId/repos/*repoPath'>
// { orgId: string; repoPath: string[] }

// No parameters
type HomeParams = ExtractParams<'/'>
// {}
```

### Using ExtractParams in Functions

```ts
import type { ExtractParams } from 'universal-router'

function fetchResource<P extends string>(
  path: P,
  params: ExtractParams<P>,
): Promise<Response> {
  let url = path as string
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, String(value))
  }
  return fetch(url)
}

// TypeScript enforces correct params
fetchResource('/users/:id', { id: '123' }) // OK
fetchResource('/users/:id', {}) // Error: missing 'id'
fetchResource('/users/:id', { id: '1', extra: 'x' }) // Error: extra property
```

## defineRoute - Type-Safe Route Definitions

The `defineRoute` helper provides type inference for route actions without manual type annotations:

```ts
import UniversalRouter, { defineRoute } from 'universal-router'

// Parameters are automatically typed from the path
const route = defineRoute({
  path: '/users/:userId',
  action: (context, params) => {
    // params.userId is typed as string
    return fetchUser(params.userId)
  },
})

// Also works with destructured context
const routeDestructured = defineRoute({
  path: '/posts/:postId/comments/:commentId',
  action: ({ params }) => {
    // params.postId and params.commentId are both string
    return fetchComment(params.postId, params.commentId)
  },
})
```

### Factory Pattern for Consistent Types

Use the factory form when you need consistent result and context types across routes:

```tsx
import UniversalRouter, { defineRoute, RouterContext } from 'universal-router'

// Custom context with app-specific properties
interface AppContext extends RouterContext {
  user?: { id: string; role: string }
  db: Database
}

// Create a factory with fixed result and context types
const route = defineRoute<JSX.Element, AppContext>()

// All routes created with this factory share the same types
const homeRoute = route({
  path: '/',
  action: (context) => {
    // context.user and context.db are available and typed
    return <HomePage user={context.user} />
  },
})

const userRoute = route({
  path: '/users/:id',
  action: (context, params) => {
    // params.id is string, context.db is Database
    return <UserPage userId={params.id} db={context.db} />
  },
})
```

### Nested Routes with Parameter Inheritance

Child routes automatically inherit parent parameters:

```ts
import { defineRoute } from 'universal-router'

const routes = defineRoute({
  path: '/orgs/:orgId',
  children: [
    defineRoute({
      path: '/teams/:teamId',
      children: [
        defineRoute({
          path: '/members/:memberId',
          action: (context, params) => {
            // All three parameters are typed:
            // params.orgId: string
            // params.teamId: string
            // params.memberId: string
            return fetchMember(params.orgId, params.teamId, params.memberId)
          },
        }),
      ],
    }),
  ],
})
```

## Typed Router Context

Extend `RouterContext` to add custom properties available in all route actions:

```ts
import UniversalRouter, { RouterContext, Route } from 'universal-router'

// Define custom context
interface AppContext extends RouterContext {
  user: { id: string; name: string } | null
  locale: string
  theme: 'light' | 'dark'
}

// Define result type
type RouteResult = {
  component: React.ComponentType
  title: string
}

// Create typed routes
const routes: Route<RouteResult, AppContext>[] = [
  {
    path: '/',
    action: (context) => {
      // context.user, context.locale, context.theme are typed
      return {
        component: HomePage,
        title: context.locale === 'en' ? 'Home' : 'Accueil',
      }
    },
  },
  {
    path: '/profile',
    action: (context) => {
      if (!context.user) {
        throw { status: 401, message: 'Unauthorized' }
      }
      return {
        component: () => <ProfilePage user={context.user!} />,
        title: `${context.user.name}'s Profile`,
      }
    },
  },
]

// Create router with typed context
const router = new UniversalRouter<RouteResult, AppContext>(routes, {
  context: {
    user: null,
    locale: 'en',
    theme: 'light',
  },
})

// Resolve with additional context
const result = await router.resolve({
  pathname: '/profile',
  user: { id: '123', name: 'Alice' },
})
```

## Type-Safe URL Generation

The `generateUrls` function provides full type safety when routes are defined with `as const`:

```ts
import UniversalRouter from 'universal-router'
import generateUrls from 'universal-router/generate-urls'

// IMPORTANT: Use 'as const' to preserve literal types
const routes = [
  { name: 'home', path: '/' },
  { name: 'users', path: '/users' },
  { name: 'user', path: '/users/:id' },
  { name: 'userPosts', path: '/users/:userId/posts/:postId' },
] as const

const router = new UniversalRouter(routes)
const url = generateUrls(router)

// Route names are type-checked
url('home') // OK: '/'
url('users') // OK: '/users'
url('user', { id: '123' }) // OK: '/users/123'
url('unknown') // Error: invalid route name

// Required parameters are enforced
url('user') // Error: missing params
url('user', {}) // Error: missing 'id'
url('userPosts', { userId: '1' }) // Error: missing 'postId'
url('userPosts', { userId: '1', postId: '2' }) // OK
```

### ExtractRouteNames and RouteNameToParams

These utility types let you work with route names and their parameters:

```ts
import type {
  ExtractRouteNames,
  RouteNameToParams,
} from 'universal-router/generate-urls'

const routes = [
  { name: 'home', path: '/' },
  { name: 'user', path: '/users/:id' },
] as const

// Extract all valid route names
type RouteNames = ExtractRouteNames<typeof routes>
// 'home' | 'user'

// Get params for a specific route
type UserParams = RouteNameToParams<typeof routes, 'user'>
// { id: string }

type HomeParams = RouteNameToParams<typeof routes, 'home'>
// {}
```

### Hierarchical Route Names

With `uniqueRouteNameSep`, nested route names are also type-checked:

```ts
const routes = [
  {
    name: 'admin',
    path: '/admin',
    children: [
      { name: 'dashboard', path: '' },
      { name: 'users', path: '/users' },
      { name: 'user', path: '/users/:userId' },
    ],
  },
] as const

const router = new UniversalRouter(routes)
const url = generateUrls(router, { uniqueRouteNameSep: '.' })

// Hierarchical names are type-checked
url('admin') // OK: '/admin'
url('admin.dashboard') // OK: '/admin'
url('admin.users') // OK: '/admin/users'
url('admin.user', { userId: '1' }) // OK: '/admin/users/1'
url('admin.unknown') // Error: invalid route name
```

## TypedRouteContext and TypedRoute

For advanced scenarios, use the typed route interfaces directly:

```ts
import type { TypedRouteContext, RouteParams } from 'universal-router'

// TypedRouteContext with specific params
interface UserContext extends TypedRouteContext<{ id: string }> {}

function userAction(context: UserContext): string {
  return `User ${context.params.id}` // params.id is string
}

// Or use inline
const route = {
  path: '/users/:id',
  action: (context: TypedRouteContext<{ id: string }>) => {
    return `User ${context.params.id}`
  },
}
```

## Error Handler Typing

Type your error handler to match your route result type:

```ts
import UniversalRouter, { RouteError, ResolveContext } from 'universal-router'

interface AppResult {
  component: React.ComponentType
  status: number
}

const router = new UniversalRouter<AppResult>(routes, {
  errorHandler(error: RouteError, context: ResolveContext): AppResult {
    if (error.status === 404) {
      return {
        component: NotFoundPage,
        status: 404,
      }
    }
    return {
      component: () => <ErrorPage error={error} />,
      status: error.status || 500,
    }
  },
})
```

## Custom resolveRoute Typing

Type-safe custom route resolution:

```ts
import UniversalRouter, {
  RouteContext,
  RouteParams,
  RouteResult,
} from 'universal-router'

interface PageResult {
  content: string
  meta: { title: string }
}

// Custom route with additional properties
interface AppRoute {
  path: string
  page?: string
  data?: (params: RouteParams) => Promise<unknown>
}

const router = new UniversalRouter<PageResult>(routes, {
  async resolveRoute(
    context: RouteContext<PageResult>,
    params: RouteParams,
  ): Promise<PageResult | undefined> {
    const route = context.route as AppRoute

    if (route.page) {
      const module = await import(route.page)
      const data = route.data ? await route.data(params) : null
      return module.default(params, data)
    }

    return undefined
  },
})
```

## Strict Mode Configuration

Enable strict TypeScript configuration for best type safety:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Generic Route Patterns

Create reusable typed route patterns:

```ts
import { defineRoute, RouterContext } from 'universal-router'

// Generic CRUD route factory
function createCrudRoutes<T, C extends RouterContext = RouterContext>(
  resource: string,
  handlers: {
    list: () => Promise<T[]>
    get: (id: string) => Promise<T>
    create: (data: Partial<T>) => Promise<T>
    update: (id: string, data: Partial<T>) => Promise<T>
    delete: (id: string) => Promise<void>
  },
) {
  const route = defineRoute<T | T[] | void, C>()

  return [
    route({
      path: `/${resource}`,
      action: () => handlers.list(),
    }),
    route({
      path: `/${resource}/:id`,
      action: (ctx, params) => handlers.get(params.id),
    }),
    // ... more routes
  ]
}

// Usage
interface User {
  id: string
  name: string
  email: string
}

const userRoutes = createCrudRoutes<User>('users', {
  list: () => fetchUsers(),
  get: (id) => fetchUser(id),
  create: (data) => createUser(data),
  update: (id, data) => updateUser(id, data),
  delete: (id) => deleteUser(id),
})
```

## Middleware with Typed Context

Create type-safe middleware that extends context:

```ts
import UniversalRouter, { RouteContext, RouterContext } from 'universal-router'

interface BaseContext extends RouterContext {
  requestId: string
}

interface AuthContext extends BaseContext {
  user: { id: string; role: string }
}

// Middleware that adds auth context
async function withAuth<R>(
  context: RouteContext<R, BaseContext>,
  next: () => Promise<R>,
): Promise<R> {
  const user = await authenticateRequest(context.requestId)
  if (!user) {
    throw { status: 401, message: 'Unauthorized' }
  }

  // Extend context with user
  ;(context as RouteContext<R, AuthContext>).user = user
  return next()
}

// Usage in route
const protectedRoute = {
  path: '/admin',
  async action(context: RouteContext<string, AuthContext>) {
    // Apply middleware
    return withAuth(context, async () => {
      // context.user is now available
      if (context.user.role !== 'admin') {
        throw { status: 403, message: 'Forbidden' }
      }
      return 'Admin Dashboard'
    })
  },
}
```

## Common TypeScript Patterns

### Discriminated Union Results

```ts
type RouteResult =
  | { type: 'page'; component: React.ComponentType; title: string }
  | { type: 'redirect'; url: string; permanent: boolean }
  | { type: 'error'; status: number; message: string }

const routes = [
  {
    path: '/',
    action: (): RouteResult => ({
      type: 'page',
      component: HomePage,
      title: 'Home',
    }),
  },
  {
    path: '/old-page',
    action: (): RouteResult => ({
      type: 'redirect',
      url: '/new-page',
      permanent: true,
    }),
  },
]

// Handle results with exhaustive checking
async function handleRoute(pathname: string) {
  const result = await router.resolve(pathname)

  switch (result.type) {
    case 'page':
      document.title = result.title
      render(result.component)
      break
    case 'redirect':
      if (result.permanent) {
        // 301 redirect
      }
      navigate(result.url)
      break
    case 'error':
      showError(result.status, result.message)
      break
    default:
      // TypeScript ensures all cases are handled
      const _exhaustive: never = result
  }
}
```

### Conditional Types for Optional Params

```ts
import type { ExtractParams, Prettify } from 'universal-router'

// Make specific params optional
type WithOptional<T, K extends keyof T> = Prettify<
  Omit<T, K> & Partial<Pick<T, K>>
>

// Usage
type Params = ExtractParams<'/users/:id/posts/:postId'>
// { id: string; postId: string }

type ParamsWithOptionalPost = WithOptional<Params, 'postId'>
// { id: string; postId?: string }
```

## Common Pitfalls

### 1. Forgetting `as const`

Without `as const`, literal types are widened:

```ts
// Wrong - types widened to string
const routes = [{ name: 'home', path: '/' }]
// typeof routes[0].name is string

// Correct - literal types preserved
const routes = [{ name: 'home', path: '/' }] as const
// typeof routes[0].name is 'home'
```

### 2. Incorrect Parameter Access

Always use the params object, not direct access:

```ts
// Wrong - params not accessible this way
{
  path: '/users/:id',
  action: (context) => context.id // Error: id doesn't exist on context
}

// Correct - use params object
{
  path: '/users/:id',
  action: (context) => context.params.id // OK
}

// Also correct - destructure params
{
  path: '/users/:id',
  action: ({ params }) => params.id // OK
}
```

### 3. Missing Return Type Annotation

Let TypeScript infer types or annotate explicitly:

```ts
// Avoid any - be explicit about result types
const router = new UniversalRouter(routes) // Result is any

// Better - specify result type
const router = new UniversalRouter<string>(routes)
const router = new UniversalRouter<JSX.Element>(routes)
const router = new UniversalRouter<RouteResult>(routes)
```

## See Also

- [URL Generation](./url-generation.md) - Type-safe URL generation
- [Nested Routes](./nested-routes.md) - Parameter inheritance in nested routes
- [Authorization](./authorization.md) - Typed auth context patterns
- [Universal Router API](./api.md) - Complete API reference
