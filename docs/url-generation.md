# Generating URLs from Route Names

Universal Router provides a `generateUrls` function that creates URL paths from route names and
parameters. This approach prevents hardcoded URLs scattered throughout your codebase and ensures
URLs stay in sync with your route definitions.

## Why Use Named Routes?

Hardcoded URLs create maintenance problems:

```js
// Fragile - if route changes, must update everywhere
;<a href="/users/123/profile">View Profile</a>
navigate('/users/123/profile')
redirect('/users/123/profile')
```

Named routes centralize URL structure:

```js
// Robust - route definition is the single source of truth
;<a href={url('userProfile', { id: '123' })}>View Profile</a>
navigate(url('userProfile', { id: '123' }))
redirect(url('userProfile', { id: '123' }))
```

## Basic Usage

Import `generateUrls` from the dedicated module and create a URL generator from your router:

```js
import UniversalRouter from 'universal-router'
import generateUrls from 'universal-router/generate-urls'

// Use 'as const' to preserve literal types for type-safe route names
const routes = [
  { name: 'home', path: '/' },
  { name: 'users', path: '/users' },
  { name: 'user', path: '/users/:id' },
  { name: 'userPosts', path: '/users/:userId/posts/:postId' },
] as const

const router = new UniversalRouter(routes)
const url = generateUrls(router)

url('home') // '/'
url('users') // '/users'
url('user', { id: '123' }) // '/users/123'
url('userPosts', { userId: '123', postId: '456' }) // '/users/123/posts/456'
```

> **Why `as const`?** Without it, TypeScript widens route names to `string`, losing
> type safety. With `as const`, you get autocomplete for route names and compile-time
> errors for typos. See [TypeScript Integration](./typescript.md) for details.

## Route Naming Conventions

Choose clear, consistent names for your routes:

```js
const routes = [
  // Resource-based naming
  { name: 'users', path: '/users' }, // List
  { name: 'user', path: '/users/:id' }, // Show
  { name: 'userEdit', path: '/users/:id/edit' }, // Edit
  { name: 'userNew', path: '/users/new' }, // Create form

  // Feature-based naming
  { name: 'dashboard', path: '/dashboard' },
  { name: 'settings', path: '/settings' },
  { name: 'settingsProfile', path: '/settings/profile' },
  { name: 'settingsSecurity', path: '/settings/security' },
]
```

## Nested Routes and Hierarchical Names

For nested routes, you can use the `uniqueRouteNameSep` option to create hierarchical names
automatically:

```js
const routes = [
  {
    name: 'admin',
    path: '/admin',
    children: [
      { name: 'dashboard', path: '' },
      { name: 'users', path: '/users' },
      {
        name: 'settings',
        path: '/settings',
        children: [
          { name: 'general', path: '' },
          { name: 'security', path: '/security' },
        ],
      },
    ],
  },
]

const router = new UniversalRouter(routes)

// Without separator - names are independent (may conflict)
const url = generateUrls(router)
url('dashboard') // '/admin'
url('users') // '/admin/users'
url('general') // '/admin/settings'

// With separator - names are prefixed with parent names
const urlWithSep = generateUrls(router, { uniqueRouteNameSep: '.' })
urlWithSep('admin') // '/admin'
urlWithSep('admin.dashboard') // '/admin'
urlWithSep('admin.users') // '/admin/users'
urlWithSep('admin.settings') // '/admin/settings'
urlWithSep('admin.settings.general') // '/admin/settings'
urlWithSep('admin.settings.security') // '/admin/settings/security'
```

### Choosing a Separator

Common separators include:

- `.` (dot): `admin.users.edit` - Most common, familiar from object notation
- `/` (slash): `admin/users/edit` - Mirrors URL structure
- `:` (colon): `admin:users:edit` - Clear visual separation

```js
// Dot notation (recommended)
generateUrls(router, { uniqueRouteNameSep: '.' })

// Slash notation
generateUrls(router, { uniqueRouteNameSep: '/' })

// Colon notation
generateUrls(router, { uniqueRouteNameSep: ':' })
```

## Query String Parameters

Parameters not used in the path can become query strings using the `stringifyQueryParams` option:

```js
import generateUrls from 'universal-router/generate-urls'

const routes = [
  { name: 'search', path: '/search' },
  { name: 'users', path: '/users' },
  { name: 'user', path: '/users/:id' },
]

const router = new UniversalRouter(routes)

// Custom query string serializer
const url = generateUrls(router, {
  stringifyQueryParams(params) {
    return new URLSearchParams(params).toString()
  },
})

// Path params used in URL, extra params become query string
url('search', { q: 'javascript', page: '1' })
// '/search?q=javascript&page=1'

url('user', { id: '123', tab: 'posts', sort: 'date' })
// '/users/123?tab=posts&sort=date'

url('users', { role: 'admin', status: 'active' })
// '/users?role=admin&status=active'
```

### Using qs Library for Complex Query Strings

For nested objects and arrays in query strings, use a library like `qs`:

```js
import qs from 'qs'
import generateUrls from 'universal-router/generate-urls'

const url = generateUrls(router, {
  stringifyQueryParams(params) {
    const query = qs.stringify(params, { arrayFormat: 'brackets' })
    return query ? `?${query}` : ''
  },
})

url('search', {
  filters: { category: 'tech', price: { min: 10, max: 100 } },
  tags: ['javascript', 'typescript'],
})
// '/search?filters[category]=tech&filters[price][min]=10&filters[price][max]=100&tags[]=javascript&tags[]=typescript'
```

## Type-Safe URL Generation

When using TypeScript with `as const` route definitions, `generateUrls` provides full type safety:

```ts
import UniversalRouter from 'universal-router'
import generateUrls from 'universal-router/generate-urls'

// Use 'as const' for type inference
const routes = [
  { name: 'home', path: '/' },
  { name: 'user', path: '/users/:id' },
  { name: 'post', path: '/posts/:postId/comments/:commentId' },
] as const

const router = new UniversalRouter(routes)
const url = generateUrls(router)

// TypeScript knows valid route names
url('home') // OK
url('user', { id: '1' }) // OK
url('invalid') // Error: Argument of type '"invalid"' is not assignable

// TypeScript enforces required parameters
url('user') // Error: Expected 2 arguments, but got 1
url('user', {}) // Error: Property 'id' is missing
url('user', { id: '1', extra: 'ok' }) // OK - extra params allowed
```

### Type-Safe Hierarchical Names

With the separator option, hierarchical names are also type-checked:

```ts
const routes = [
  {
    name: 'admin',
    path: '/admin',
    children: [
      { name: 'users', path: '/users' },
      { name: 'user', path: '/users/:userId' },
    ],
  },
] as const

const router = new UniversalRouter(routes)
const url = generateUrls(router, { uniqueRouteNameSep: '.' })

url('admin') // OK: '/admin'
url('admin.users') // OK: '/admin/users'
url('admin.user', { userId: '1' }) // OK: '/admin/users/1'

url('admin.invalid') // Error: not a valid route name
url('admin.user') // Error: missing required userId param
```

## Base URL Support

If your router has a `baseUrl`, generated URLs include it automatically:

```js
const router = new UniversalRouter(routes, {
  baseUrl: '/app',
})

const url = generateUrls(router)

url('home') // '/app/'
url('user', { id: '1' }) // '/app/users/1'
```

## Path Encoding Options

Control how parameters are encoded using path-to-regexp options:

```js
const url = generateUrls(router, {
  // Custom encoder (default is encodeURIComponent)
  encode: (value, token) => {
    // Don't encode slashes for wildcard params
    if (token.name === 'path') {
      return value
    }
    return encodeURIComponent(value)
  },
})

// With wildcard route: { name: 'file', path: '/files/*path' }
url('file', { path: 'docs/api/readme.md' })
// '/files/docs/api/readme.md' (slashes preserved)
```

## Integration Patterns

### React Navigation Helper

Create a custom hook for type-safe navigation:

```tsx
import { useMemo, useCallback } from 'react'
import UniversalRouter from 'universal-router'
import generateUrls from 'universal-router/generate-urls'

const routes = [
  { name: 'home', path: '/' },
  { name: 'user', path: '/users/:id' },
  { name: 'userPosts', path: '/users/:userId/posts' },
] as const

const router = new UniversalRouter(routes)

export function useNavigation() {
  const url = useMemo(() => generateUrls(router), [])

  const navigate = useCallback(
    <Name extends Parameters<typeof url>[0]>(
      name: Name,
      ...args: Parameters<typeof url> extends [Name, ...infer Rest]
        ? Rest
        : never
    ) => {
      const path = url(name, ...args)
      window.history.pushState(null, '', path)
      // Trigger your router's resolve
    },
    [url],
  )

  return { url, navigate }
}

// Usage in components
function UserLink({ userId }: { userId: string }) {
  const { url } = useNavigation()

  return <a href={url('user', { id: userId })}>View Profile</a>
}
```

### Express/Server Integration

Generate URLs for server-side redirects and links:

```ts
import express from 'express'
import UniversalRouter from 'universal-router'
import generateUrls from 'universal-router/generate-urls'

const routes = [
  { name: 'home', path: '/' },
  { name: 'login', path: '/login' },
  { name: 'user', path: '/users/:id' },
] as const

const router = new UniversalRouter(routes)
const url = generateUrls(router)

const app = express()

// Redirect using named routes
app.get('/old-profile/:id', (req, res) => {
  res.redirect(301, url('user', { id: req.params.id }))
})

// Generate URLs in templates
app.get('/dashboard', (req, res) => {
  res.render('dashboard', {
    links: {
      home: url('home'),
      profile: url('user', { id: req.user.id }),
    },
  })
})
```

### Link Component

Create a reusable Link component with named route support:

```tsx
import { AnchorHTMLAttributes } from 'react'
import generateUrls from 'universal-router/generate-urls'

// Assuming routes and router are defined elsewhere
import { router, routes } from './routes'

const url = generateUrls(router)

type RouteName = Parameters<typeof url>[0]

interface LinkProps<Name extends RouteName>
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: Name
  params?: Parameters<typeof url>[1]
}

function Link<Name extends RouteName>({
  to,
  params,
  children,
  onClick,
  ...props
}: LinkProps<Name>) {
  const href = url(to, params)

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (onClick) onClick(e)
    if (e.defaultPrevented) return
    if (e.metaKey || e.ctrlKey || e.shiftKey) return

    e.preventDefault()
    window.history.pushState(null, '', href)
    // Trigger navigation
  }

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}

// Usage
<Link to="user" params={{ id: '123' }}>View User</Link>
<Link to="home">Home</Link>
```

## Error Handling

The `generateUrls` function throws errors for invalid route names:

```js
const url = generateUrls(router)

try {
  url('nonexistent')
} catch (error) {
  console.error(error.message) // 'Route "nonexistent" not found'
}

try {
  url('user') // Missing required 'id' param
} catch (error) {
  console.error(error.message) // Error from path-to-regexp about missing param
}
```

### Safe URL Generation

Create a wrapper that returns `null` for invalid routes:

```ts
function safeUrl(name: string, params?: Record<string, string>): string | null {
  try {
    return url(name, params)
  } catch {
    console.warn(`Failed to generate URL for route "${name}"`)
    return null
  }
}

// Usage
const href = safeUrl('user', { id: '123' }) ?? '/fallback'
```

## Common Pitfalls

### 1. Forgetting `as const`

Without `as const`, TypeScript cannot infer literal types:

```ts
// Wrong - types are widened to string
const routes = [{ name: 'home', path: '/' }]
// name is string, not 'home'

// Correct - literal types preserved
const routes = [{ name: 'home', path: '/' }] as const
// name is 'home'
```

### 2. Route Name Conflicts

Without a separator, nested routes can have conflicting names:

```js
const routes = [
  {
    name: 'users',
    path: '/admin/users',
    children: [
      { name: 'users', path: '/public/users' }, // Conflict!
    ],
  },
]

const url = generateUrls(router)
url('users') // Which one? Throws error: Route "users" already exists
```

Solution: Use `uniqueRouteNameSep` or unique names.

### 3. Missing Parameters

All path parameters must be provided:

```js
const routes = [{ name: 'post', path: '/users/:userId/posts/:postId' }]

// Wrong - missing postId
url('post', { userId: '1' }) // Throws error

// Correct - all params provided
url('post', { userId: '1', postId: '2' })
```

### 4. Array Parameters for Wildcards

Wildcard parameters expect arrays:

```js
const routes = [{ name: 'files', path: '/files/*path' }]

// For single segment
url('files', { path: ['readme.md'] }) // '/files/readme.md'

// For multiple segments
url('files', { path: ['docs', 'api', 'readme.md'] }) // '/files/docs/api/readme.md'
```

## See Also

- [TypeScript Integration](./typescript.md) - Full TypeScript setup with type inference
- [Nested Routes](./nested-routes.md) - Working with nested route structures
- [SPA Navigation](./spa-navigation.md) - Client-side navigation patterns
- [Universal Router API](./api.md) - Complete API reference
