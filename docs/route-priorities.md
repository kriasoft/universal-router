# Route Matching Order and Priorities

Universal Router uses a simple, predictable matching algorithm: routes are matched in the order
they are defined, from top to bottom. The first route whose path matches the URL pathname
**and** whose action returns a value (not `null` or `undefined`) wins. Understanding this
behavior is crucial for designing reliable route configurations.

## First-Match Wins

Routes are evaluated in definition order. Once a match is found and the action returns a value,
the search stops.

```js
import UniversalRouter from 'universal-router'

const router = new UniversalRouter([
  { path: '/about', action: () => 'About Page' }, // Checked first
  { path: '/contact', action: () => 'Contact Page' }, // Checked second
  { path: '/:page', action: (ctx, p) => `Dynamic: ${p.page}` }, // Checked third
])

await router.resolve('/about')
// => 'About Page' (first route matches)

await router.resolve('/contact')
// => 'Contact Page' (second route matches)

await router.resolve('/pricing')
// => 'Dynamic: pricing' (third route matches)
```

## Static vs. Parameterized Routes

A common pitfall is placing parameterized routes before static routes. The parameter route
will match URLs that should go to specific routes.

### Problem: Parameter Route Too Early

```js
// Wrong order - parameter catches everything!
const router = new UniversalRouter([
  { path: '/:username', action: (ctx, p) => `User: ${p.username}` },
  { path: '/about', action: () => 'About Page' }, // Never reached!
  { path: '/settings', action: () => 'Settings' }, // Never reached!
])

await router.resolve('/about')
// => 'User: about' - Wrong! Matched the parameter route
```

### Solution: Specific Routes First

```js
// Correct order - specific routes before parameters
const router = new UniversalRouter([
  { path: '/about', action: () => 'About Page' },
  { path: '/settings', action: () => 'Settings' },
  { path: '/:username', action: (ctx, p) => `User: ${p.username}` },
])

await router.resolve('/about')
// => 'About Page' - Correct!

await router.resolve('/john')
// => 'User: john' - Also correct!
```

## Ordering Guidelines

Follow these guidelines when ordering routes:

### 1. Most Specific First

```js
const router = new UniversalRouter([
  // Most specific - exact static paths
  { path: '/users/me', action: () => 'Current User' },
  { path: '/users/new', action: () => 'Create User' },

  // Less specific - single parameter
  { path: '/users/:id', action: (ctx, p) => `User ${p.id}` },

  // Least specific - multiple parameters
  {
    path: '/users/:id/:action',
    action: (ctx, p) => `${p.action} user ${p.id}`,
  },
])
```

### 2. Longer Paths Before Shorter

```js
const router = new UniversalRouter([
  { path: '/api/v2/users', action: () => 'API v2 Users' },
  { path: '/api/v1/users', action: () => 'API v1 Users' },
  { path: '/api/users', action: () => 'API Users (default)' },
])
```

### 3. Wildcards Last

Wildcard routes (`*name`) match multiple segments and should be placed after more specific routes:

```js
const router = new UniversalRouter([
  { path: '/docs', action: () => 'Documentation Home' },
  { path: '/docs/api', action: () => 'API Reference' },
  { path: '/docs/guides/:guide', action: (ctx, p) => `Guide: ${p.guide}` },
  { path: '/docs/*path', action: (ctx, p) => `Doc: ${p.path.join('/')}` }, // Catch-all last
])
```

## Handling Conflicts

### Same Path, Different Conditions

When you need the same path to behave differently based on conditions, use a single route
with conditional logic:

```js
const router = new UniversalRouter([
  {
    path: '/dashboard',
    action: (context) => {
      if (!context.user) {
        return { redirect: '/login' }
      }
      if (context.user.role === 'admin') {
        return { component: 'AdminDashboard' }
      }
      return { component: 'UserDashboard' }
    },
  },
])
```

### Overlapping Parameter Patterns

When routes have different parameter patterns that could overlap:

```js
// Problem: How to match /tickets/seattle-washington vs /tickets/UA-123?
const router = new UniversalRouter([
  {
    path: '/tickets/:route', // Could be either!
    action: (context, params) => {
      // Determine which type based on pattern
      if (params.route.match(/^[A-Z]{2}-\d+$/)) {
        return { type: 'flight', code: params.route }
      }
      return { type: 'destination', route: params.route }
    },
  },
])
```

Or use separate routes with validation:

```js
const router = new UniversalRouter([
  {
    path: '/tickets/:flightCode',
    action: (context, params) => {
      // Only match flight codes (e.g., UA-123)
      if (!params.flightCode.match(/^[A-Z]{2}-\d+$/)) {
        return null // Skip to next route
      }
      return { type: 'flight', code: params.flightCode }
    },
  },
  {
    path: '/tickets/:destination',
    action: (context, params) => {
      return { type: 'destination', name: params.destination }
    },
  },
])

await router.resolve('/tickets/UA-123')
// => { type: 'flight', code: 'UA-123' }

await router.resolve('/tickets/seattle-washington')
// => { type: 'destination', name: 'seattle-washington' }
```

## Using `null` to Skip Routes

Return `null` from an action to explicitly skip the route and continue matching:

```js
const router = new UniversalRouter([
  {
    path: '/posts/:id',
    action: async (context, params) => {
      // Only match numeric IDs
      if (!/^\d+$/.test(params.id)) {
        return null // Skip to next route
      }
      const post = await fetchPost(params.id)
      return post ? { post } : null // Skip if not found
    },
  },
  {
    path: '/posts/:slug',
    action: async (context, params) => {
      // Match slug-based posts
      const post = await fetchPostBySlug(params.slug)
      return post ? { post } : null
    },
  },
  {
    path: '/posts/*rest',
    action: () => ({ error: 'Post not found', status: 404 }),
  },
])
```

## Nested Route Priority

Within nested routes, children are matched in order after the parent matches:

```js
const router = new UniversalRouter({
  path: '/admin',
  children: [
    { path: '/users/new', action: () => 'Create User' }, // Matched first for /admin/users/new
    { path: '/users/:id', action: (ctx, p) => `User ${p.id}` }, // Matched second
    { path: '/users', action: () => 'User List' }, // Matched for /admin/users
  ],
})
```

### Parent Action with `next()`

When a parent has an action that calls `next()`, children are evaluated in order:

```js
const router = new UniversalRouter({
  path: '/api',
  action: async (context) => {
    // Middleware - runs first
    console.log('API request:', context.pathname)
    return context.next() // Continue to children
  },
  children: [
    { path: '/users', action: () => ({ data: 'users' }) },
    { path: '/posts', action: () => ({ data: 'posts' }) },
    { path: '/*rest', action: () => ({ error: 'Not found' }) },
  ],
})
```

## Route Priority Patterns

### Feature Flags

```js
const router = new UniversalRouter([
  {
    path: '/checkout',
    action: (context) => {
      // New checkout for beta users
      if (context.features?.newCheckout) {
        return { component: 'CheckoutV2' }
      }
      return null // Fall through to old checkout
    },
  },
  {
    path: '/checkout',
    action: () => ({ component: 'CheckoutV1' }),
  },
])
```

### A/B Testing

```js
const router = new UniversalRouter([
  {
    path: '/landing',
    action: (context) => {
      // 50/50 split
      const variant =
        context.abTest?.landing || (Math.random() > 0.5 ? 'A' : 'B')

      if (variant === 'A') {
        return { component: 'LandingA', variant }
      }
      return { component: 'LandingB', variant }
    },
  },
])
```

### Gradual Migration

```js
const router = new UniversalRouter([
  // New routes being rolled out
  {
    path: '/products/:id',
    action: (context, params) => {
      // Only serve new page for certain product categories
      if (context.newProductPages?.includes(params.id.split('-')[0])) {
        return { component: 'NewProductPage' }
      }
      return null // Use old page
    },
  },
  // Legacy route
  {
    path: '/products/:id',
    action: () => ({ component: 'LegacyProductPage' }),
  },
])
```

## Debugging Route Matching

Add logging to understand which routes are being evaluated:

```js
const router = new UniversalRouter(routes, {
  resolveRoute(context, params) {
    console.log('Checking route:', context.route.path, 'for:', context.pathname)

    if (typeof context.route.action === 'function') {
      const result = context.route.action(context, params)
      console.log('Action result:', result === null ? 'null (skip)' : result)
      return result
    }
    return undefined
  },
})
```

### Using Route Names for Debugging

```js
const router = new UniversalRouter([
  { path: '/users', name: 'user-list', action: () => 'List' },
  { path: '/users/:id', name: 'user-detail', action: () => 'Detail' },
])

// In resolveRoute
console.log('Matched route:', context.route.name)
```

## Common Pitfalls

### 1. Catch-All Before Specific Routes

```js
// Wrong - catch-all first
const routes = [
  { path: '/*path', action: () => 'Catch All' },
  { path: '/about', action: () => 'About' }, // Never reached!
]

// Correct - catch-all last
const routes = [
  { path: '/about', action: () => 'About' },
  { path: '/*path', action: () => 'Catch All' },
]
```

### 2. Empty Path Priority

Empty paths (`path: ''`) match their parent exactly:

```js
const router = new UniversalRouter({
  path: '/users',
  children: [
    { path: '', action: () => 'User Index' }, // Matches /users
    { path: '/:id', action: () => 'User Detail' }, // Matches /users/123
  ],
})
```

### 3. Forgetting Return Value Matters

Routes that return `undefined` continue matching; routes that return `null` skip:

```js
{
  path: '/page',
  action: (context) => {
    if (!context.authorized) {
      // Returns undefined - continues to children or next route
      return undefined
    }
    // Returns value - stops matching
    return { content: 'Page' }
  }
}
```

### 4. Async Actions and Order

Async actions are awaited before checking the result:

```js
const router = new UniversalRouter([
  {
    path: '/:id',
    async action(context, params) {
      const item = await fetchItem(params.id)
      if (!item) return null // Skip to next route
      return { item }
    },
  },
  {
    path: '/:id',
    action: () => ({ error: 'Not found' }),
  },
])
```

## See Also

- [Nested Routes and Layouts](./nested-routes.md) - Route hierarchy and matching
- [Handling 404 Not Found](./404-not-found.md) - Catch-all and error routes
- [Universal Router API](./api.md) - Complete API reference
