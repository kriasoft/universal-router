# Nested Routes and Layouts

Nested routes allow you to build hierarchical URL structures where child routes inherit context
from their parents. This pattern is essential for creating layouts, shared navigation, and
multi-level applications like dashboards or content management systems.

## Understanding Nested Routes

When you define child routes, Universal Router matches the parent path first, then continues
matching against children using the remaining pathname. Parameters from parent routes are
automatically inherited by children.

```
URL: /admin/users/123

Route tree:
/admin          <- matches, continues to children
  /users        <- matches, continues to children
    /:userId    <- matches, action is called
```

## Basic Nested Structure

```js
import UniversalRouter from 'universal-router'

const router = new UniversalRouter({
  path: '/admin',
  children: [
    {
      path: '', // Matches /admin exactly
      action: () => '<h1>Admin Dashboard</h1>',
    },
    {
      path: '/users',
      children: [
        {
          path: '', // Matches /admin/users
          action: () => '<h1>User List</h1>',
        },
        {
          path: '/:userId', // Matches /admin/users/123
          action: (context, params) => `<h1>User ${params.userId}</h1>`,
        },
      ],
    },
    {
      path: '/settings',
      action: () => '<h1>Settings</h1>',
    },
  ],
})

await router.resolve('/admin')
// => '<h1>Admin Dashboard</h1>'

await router.resolve('/admin/users')
// => '<h1>User List</h1>'

await router.resolve('/admin/users/123')
// => '<h1>User ${params.userId}</h1>'
```

## Index Routes

An index route is a child with an empty path (`path: ''`). It matches when the parent path
matches exactly, without any additional segments.

```js
const router = new UniversalRouter({
  path: '/products',
  children: [
    {
      path: '', // Index route - matches /products
      action: () => 'Product Catalog',
    },
    {
      path: '/:productId', // Matches /products/abc
      action: (ctx, params) => `Product: ${params.productId}`,
    },
  ],
})

await router.resolve('/products')
// => 'Product Catalog'

await router.resolve('/products/')
// => 'Product Catalog' (trailing slash is handled)

await router.resolve('/products/widget-x')
// => 'Product: widget-x'
```

## Parameter Inheritance

Child routes automatically receive parameters captured by parent routes. This is useful for
deeply nested structures where multiple levels need access to parent IDs.

### Type-Safe Parameter Inheritance (Recommended)

Use `defineRoute` for automatic type inference across nested routes:

```ts
import UniversalRouter, { defineRoute } from 'universal-router'

// Parameters from all ancestor routes are automatically typed
const routes = defineRoute({
  path: '/organizations/:orgId',
  children: [
    defineRoute({
      path: '/teams/:teamId',
      children: [
        defineRoute({
          path: '/members/:memberId',
          action: (context, params) => {
            // All three parameters are typed as string:
            // - params.orgId (from grandparent)
            // - params.teamId (from parent)
            // - params.memberId (from this route)
            return {
              org: params.orgId,
              team: params.teamId,
              member: params.memberId,
            }
          },
        }),
      ],
    }),
  ],
})

const router = new UniversalRouter(routes)

await router.resolve('/organizations/acme/teams/engineering/members/alice')
// => { org: 'acme', team: 'engineering', member: 'alice' }
```

### JavaScript Version

For JavaScript projects without TypeScript:

```js
const router = new UniversalRouter({
  path: '/organizations/:orgId',
  children: [
    {
      path: '/teams/:teamId',
      children: [
        {
          path: '/members/:memberId',
          action: (context, params) => {
            // All three parameters are available
            return {
              org: params.orgId,
              team: params.teamId,
              member: params.memberId,
            }
          },
        },
      ],
    },
  ],
})

await router.resolve('/organizations/acme/teams/engineering/members/alice')
// => { org: 'acme', team: 'engineering', member: 'alice' }
```

## Shared Layouts with Middleware

Parent routes can act as middleware that wraps child content. Use `context.next()` to render
children and wrap the result.

```js
const router = new UniversalRouter({
  path: '',
  async action(context) {
    // Call children first
    const content = await context.next()

    // Wrap with layout
    return `
      <!DOCTYPE html>
      <html>
        <head><title>My App</title></head>
        <body>
          <nav>Navigation here</nav>
          <main>${content}</main>
          <footer>Footer here</footer>
        </body>
      </html>
    `
  },
  children: [
    { path: '/', action: () => '<h1>Home</h1>' },
    { path: '/about', action: () => '<h1>About</h1>' },
  ],
})
```

### Multiple Layout Levels

Create nested layouts for complex applications:

```js
const router = new UniversalRouter({
  path: '',
  async action(context) {
    const content = await context.next()
    return `<div class="root-layout">${content}</div>`
  },
  children: [
    {
      path: '/',
      action: () => '<h1>Home</h1>',
    },
    {
      path: '/dashboard',
      async action(context) {
        const content = await context.next()
        return `
          <div class="dashboard-layout">
            <aside class="sidebar">Dashboard Menu</aside>
            <div class="dashboard-content">${content}</div>
          </div>
        `
      },
      children: [
        {
          path: '', // /dashboard
          action: () => '<h1>Dashboard Overview</h1>',
        },
        {
          path: '/analytics', // /dashboard/analytics
          action: () => '<h1>Analytics</h1>',
        },
        {
          path: '/reports', // /dashboard/reports
          action: () => '<h1>Reports</h1>',
        },
      ],
    },
  ],
})

await router.resolve('/dashboard/analytics')
// Returns nested layouts: root-layout > dashboard-layout > Analytics content
```

## Dynamic Layout Selection

Choose layouts based on route properties or context:

```js
const router = new UniversalRouter({
  path: '',
  async action(context) {
    const content = await context.next()

    // Check if route wants full-width layout
    if (context.route.fullWidth) {
      return `<div class="full-width">${content}</div>`
    }

    return `
      <div class="standard-layout">
        <nav>Navigation</nav>
        <main>${content}</main>
      </div>
    `
  },
  children: [
    {
      path: '/',
      action: () => '<h1>Home</h1>',
    },
    {
      path: '/presentation',
      fullWidth: true, // Custom property
      action: () => '<div class="slides">Presentation Content</div>',
    },
  ],
})
```

## Handling Missing Children

When a parent matches but no child matches, the router continues searching. Control this
behavior explicitly:

```js
const router = new UniversalRouter({
  path: '/docs',
  action(context) {
    // This runs when /docs matches
    // Return undefined to continue to children
    // Return null to skip this entire branch
    // Return a value to stop matching

    // Continue to children
    return context.next()
  },
  children: [
    { path: '', action: () => 'Documentation Home' },
    { path: '/:page', action: (ctx, p) => `Doc: ${p.page}` },
  ],
})
```

### Catch-All Children

Use an empty `children` array to match all paths under a parent:

```js
const router = new UniversalRouter({
  path: '/legacy',
  children: [], // Empty array acts as catch-all
  action: () => 'This matches /legacy and all sub-paths',
})

await router.resolve('/legacy')
// => 'This matches /legacy and all sub-paths'

await router.resolve('/legacy/any/path/here')
// => 'This matches /legacy and all sub-paths'
```

## Route Organization Patterns

### Feature-Based Organization

Organize routes by feature for better maintainability:

```js
// routes/users.js
export const userRoutes = {
  path: '/users',
  children: [
    { path: '', action: () => 'User List' },
    { path: '/:id', action: (ctx, p) => `User ${p.id}` },
    { path: '/:id/edit', action: (ctx, p) => `Edit User ${p.id}` },
  ],
}

// routes/products.js
export const productRoutes = {
  path: '/products',
  children: [
    { path: '', action: () => 'Product Catalog' },
    { path: '/:id', action: (ctx, p) => `Product ${p.id}` },
  ],
}

// routes/index.js
import { userRoutes } from './users'
import { productRoutes } from './products'

export const routes = {
  path: '',
  children: [{ path: '/', action: () => 'Home' }, userRoutes, productRoutes],
}
```

### Dynamic Route Loading

Load route definitions dynamically for code splitting:

```js
const router = new UniversalRouter({
  path: '',
  children: [
    { path: '/', action: () => 'Home' },
    {
      path: '/admin',
      async action(context) {
        // Dynamically load admin routes
        const { adminRoutes } = await import('./admin-routes')

        // Create a sub-router for admin section
        const adminRouter = new UniversalRouter(adminRoutes)

        // Resolve the remaining path
        const subPath = context.pathname.replace('/admin', '') || '/'
        return adminRouter.resolve(subPath)
      },
    },
  ],
})
```

## React Component Example

Here is how nested routes work with React components:

```jsx
import UniversalRouter from 'universal-router'

const router = new UniversalRouter({
  path: '',
  async action(context) {
    const children = await context.next()
    return <AppLayout user={context.user}>{children}</AppLayout>
  },
  children: [
    {
      path: '/',
      action: () => <HomePage />,
    },
    {
      path: '/dashboard',
      async action(context) {
        const children = await context.next()
        return <DashboardLayout>{children}</DashboardLayout>
      },
      children: [
        {
          path: '',
          action: () => <DashboardHome />,
        },
        {
          path: '/settings',
          action: () => <Settings />,
        },
        {
          path: '/profile/:userId',
          action: (context, params) => <UserProfile userId={params.userId} />,
        },
      ],
    },
  ],
})
```

## Common Pitfalls

### 1. Parent Action Returns Value

If a parent action returns a value (not `undefined`), children are not matched:

```js
// Wrong - children will never be reached
{
  path: '/admin',
  action: () => 'Admin', // Returns value, stops matching
  children: [
    { path: '/users', action: () => 'Users' }, // Never reached!
  ],
}

// Correct - use context.next() or return undefined
{
  path: '/admin',
  action: (context) => context.next(), // Continues to children
  children: [
    { path: '/users', action: () => 'Users' },
  ],
}

// Also correct - no action, just structure
{
  path: '/admin',
  children: [
    { path: '', action: () => 'Admin Home' },
    { path: '/users', action: () => 'Users' },
  ],
}
```

### 2. Forgetting Index Route

Without an index route, the parent path without trailing content returns 404:

```js
// Wrong - /dashboard returns 404
{
  path: '/dashboard',
  children: [
    { path: '/stats', action: () => 'Stats' },
  ],
}

// Correct - add index route
{
  path: '/dashboard',
  children: [
    { path: '', action: () => 'Dashboard Home' }, // Handles /dashboard
    { path: '/stats', action: () => 'Stats' },
  ],
}
```

### 3. Child Path Starting Without Slash

Child paths that do not start with `/` are relative to parent:

```js
// These are equivalent
{ path: '/users', children: [{ path: '/:id' }] }
{ path: '/users', children: [{ path: ':id' }] }

// Both match: /users/123
```

### 4. Parameter Name Conflicts

When parent and child have the same parameter name, child wins:

```js
{
  path: '/items/:id',
  children: [
    {
      path: '/subitems/:id', // Same name 'id'
      action: (ctx, params) => {
        // params.id is the subitem ID, not item ID!
        // Parent ID is lost
      },
    },
  ],
}

// Better - use unique names
{
  path: '/items/:itemId',
  children: [
    {
      path: '/subitems/:subitemId',
      action: (ctx, params) => {
        // params.itemId = parent item
        // params.subitemId = child item
      },
    },
  ],
}
```

## See Also

- [Route Matching Order and Priorities](./route-priorities.md) - How routes are matched
- [Building Navigation Breadcrumbs](./breadcrumbs.md) - Using route hierarchy for breadcrumbs
- [Code Splitting](./code-splitting.md) - Lazy loading nested routes
- [Universal Router API](./api.md) - Complete API reference
