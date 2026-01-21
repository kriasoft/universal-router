# Authorization and Protected Routes

Protecting routes based on user authentication and roles is a common requirement. Universal Router's
middleware pattern makes it straightforward to implement authorization at any level of your
route hierarchy.

## Basic Authentication Check

The simplest authorization pattern checks if a user is logged in:

```js
import UniversalRouter from 'universal-router'

const routes = [
  {
    path: '/login',
    action() {
      return { content: '<h1>Login</h1>' }
    },
  },
  {
    path: '/dashboard',
    action(context) {
      // Check if user is authenticated
      if (!context.user) {
        return { redirect: '/login' }
      }
      return { content: '<h1>Dashboard</h1>' }
    },
  },
]

const router = new UniversalRouter(routes)

// Resolve with user context
router.resolve({ pathname: '/dashboard', user: null }).then((page) => {
  if (page.redirect) {
    window.location.href = page.redirect
  } else {
    document.body.innerHTML = page.content
  }
})
```

## Middleware Pattern for Route Groups

Protect multiple routes at once using the middleware pattern:

```js
const adminRoutes = {
  path: '/admin',
  action(context) {
    // This runs before any child route
    if (!context.user) {
      return { redirect: '/login' }
    }
    // Continue to child routes
    return context.next()
  },
  children: [
    {
      path: '', // /admin
      action: () => ({ content: '<h1>Admin Dashboard</h1>' }),
    },
    {
      path: '/users', // /admin/users
      action: () => ({ content: '<h1>Manage Users</h1>' }),
    },
    {
      path: '/settings', // /admin/settings
      action: () => ({ content: '<h1>Settings</h1>' }),
    },
  ],
}
```

## Role-Based Access Control

Implement different permission levels:

```ts
import UniversalRouter, { RouteContext } from 'universal-router'

// Define user roles
type Role = 'guest' | 'user' | 'moderator' | 'admin'

interface User {
  id: string
  name: string
  role: Role
}

interface AppContext {
  pathname: string
  user: User | null
}

interface PageResult {
  content?: string
  redirect?: string
}

// Role hierarchy - higher roles include lower role permissions
const roleHierarchy: Record<Role, number> = {
  guest: 0,
  user: 1,
  moderator: 2,
  admin: 3,
}

function hasPermission(user: User | null, requiredRole: Role): boolean {
  if (!user) return requiredRole === 'guest'
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}

// Create a guard factory
function requireRole(role: Role) {
  return (context: RouteContext<PageResult, AppContext>) => {
    if (!hasPermission(context.user, role)) {
      if (!context.user) {
        // Not logged in - redirect to login
        return { redirect: `/login?returnTo=${context.pathname}` }
      }
      // Logged in but insufficient permissions
      return { content: '<h1>Access Denied</h1>' }
    }
    return context.next()
  }
}

const routes = [
  { path: '/', action: () => ({ content: '<h1>Home</h1>' }) },
  { path: '/login', action: () => ({ content: '<h1>Login</h1>' }) },

  // User area - requires logged in user
  {
    path: '/profile',
    action: requireRole('user'),
    children: [
      { path: '', action: () => ({ content: '<h1>My Profile</h1>' }) },
      { path: '/settings', action: () => ({ content: '<h1>Settings</h1>' }) },
    ],
  },

  // Moderator area
  {
    path: '/moderate',
    action: requireRole('moderator'),
    children: [
      { path: '', action: () => ({ content: '<h1>Moderation Queue</h1>' }) },
      { path: '/reports', action: () => ({ content: '<h1>Reports</h1>' }) },
    ],
  },

  // Admin area
  {
    path: '/admin',
    action: requireRole('admin'),
    children: [
      { path: '', action: () => ({ content: '<h1>Admin Dashboard</h1>' }) },
      { path: '/users', action: () => ({ content: '<h1>Manage Users</h1>' }) },
    ],
  },
]

const router = new UniversalRouter<PageResult, AppContext>(routes)
```

## Declarative Authorization

Use a custom `resolveRoute` for declarative authorization:

```ts
interface ProtectedRoute {
  path?: string
  requireAuth?: boolean
  roles?: Role[]
  content?: string
  children?: ProtectedRoute[]
}

const routes: ProtectedRoute[] = [
  { path: '/', content: '<h1>Home</h1>' },
  { path: '/login', content: '<h1>Login</h1>' },
  { path: '/profile', requireAuth: true, content: '<h1>Profile</h1>' },
  {
    path: '/admin',
    roles: ['admin'],
    children: [
      { path: '', content: '<h1>Admin Home</h1>' },
      { path: '/users', content: '<h1>Users</h1>' },
    ],
  },
]

const router = new UniversalRouter(routes, {
  resolveRoute(context, params) {
    const { route, user } = context

    // Check authentication
    if (route.requireAuth && !user) {
      return { redirect: '/login' }
    }

    // Check roles
    if (route.roles && route.roles.length > 0) {
      if (!user || !route.roles.includes(user.role)) {
        return user ? { content: '<h1>Forbidden</h1>' } : { redirect: '/login' }
      }
    }

    // Return content if present
    if (route.content) {
      return { content: route.content }
    }

    // No content means continue to children
    return undefined
  },
})
```

## Preserving Return URL

Redirect users back to their original destination after login:

```ts
const routes = [
  {
    path: '/login',
    action(context) {
      const returnTo = context.query?.returnTo || '/'
      return {
        content: `
          <h1>Login</h1>
          <form action="/api/login" method="POST">
            <input type="hidden" name="returnTo" value="${returnTo}" />
            <button type="submit">Login</button>
          </form>
        `,
      }
    },
  },
  {
    path: '/protected',
    action(context) {
      if (!context.user) {
        // Encode the current path for redirect
        const returnTo = encodeURIComponent(context.pathname)
        return { redirect: `/login?returnTo=${returnTo}` }
      }
      return { content: '<h1>Protected Content</h1>' }
    },
  },
]
```

## Permission-Based Authorization

For fine-grained control, check specific permissions:

```ts
interface User {
  id: string
  permissions: string[]
}

function hasPermission(user: User | null, permission: string): boolean {
  return user?.permissions.includes(permission) ?? false
}

function requirePermission(permission: string) {
  return (context: RouteContext) => {
    if (!hasPermission(context.user, permission)) {
      return { error: 'Forbidden', status: 403 }
    }
    return context.next()
  }
}

const routes = [
  {
    path: '/posts',
    children: [
      {
        path: '',
        action: requirePermission('posts:read'),
        children: [{ path: '', action: () => ({ content: 'Post List' }) }],
      },
      {
        path: '/create',
        action: requirePermission('posts:create'),
        children: [{ path: '', action: () => ({ content: 'Create Post' }) }],
      },
      {
        path: '/:id/edit',
        action: requirePermission('posts:update'),
        children: [{ path: '', action: () => ({ content: 'Edit Post' }) }],
      },
      {
        path: '/:id/delete',
        action: requirePermission('posts:delete'),
        children: [{ path: '', action: () => ({ content: 'Delete Post' }) }],
      },
    ],
  },
]
```

## Resource-Based Authorization

Check ownership or specific resource permissions:

```ts
const routes = [
  {
    path: '/posts/:id',
    async action(context) {
      const postId = context.params.id

      // Fetch the resource
      const post = await fetchPost(postId)

      if (!post) {
        return { error: 'Not Found', status: 404 }
      }

      // Check if user can access this specific post
      const canAccess =
        post.isPublic ||
        context.user?.id === post.authorId ||
        context.user?.role === 'admin'

      if (!canAccess) {
        return { error: 'Forbidden', status: 403 }
      }

      // Pass the post to child routes
      context.post = post
      return context.next()
    },
    children: [
      {
        path: '',
        action(context) {
          return { content: `<h1>${context.post.title}</h1>` }
        },
      },
      {
        path: '/edit',
        action(context) {
          // Additional check for editing
          if (context.user?.id !== context.post.authorId) {
            return { error: 'Forbidden', status: 403 }
          }
          return { content: '<h1>Edit Post</h1>' }
        },
      },
    ],
  },
]
```

## Server-Side Authorization

Implement authorization on the server with Express:

```ts
import express from 'express'
import UniversalRouter from 'universal-router'

const app = express()

// Authentication middleware
app.use((req, res, next) => {
  // Get user from session, JWT, etc.
  req.user = getUserFromSession(req)
  next()
})

app.get('*', async (req, res) => {
  const router = new UniversalRouter(routes)

  try {
    const page = await router.resolve({
      pathname: req.path,
      user: req.user,
      query: req.query,
    })

    if (page.redirect) {
      res.redirect(page.status || 302, page.redirect)
      return
    }

    if (page.status === 403) {
      res.status(403).send('<h1>Forbidden</h1>')
      return
    }

    res.send(page.content)
  } catch (error) {
    if (error.status === 404) {
      res.status(404).send('<h1>Not Found</h1>')
    } else {
      throw error
    }
  }
})
```

## Client-Side Authorization with React

Integrate authorization with React components:

```tsx
import { createContext, useContext, ReactNode } from 'react'
import UniversalRouter from 'universal-router'

// Auth context
interface AuthContextValue {
  user: User | null
  login: (credentials: Credentials) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

// Protected component wrapper
interface ProtectedProps {
  children: ReactNode
  requiredRole?: Role
  fallback?: ReactNode
}

export function Protected({
  children,
  requiredRole = 'user',
  fallback,
}: ProtectedProps) {
  const { user } = useAuth()

  if (!hasPermission(user, requiredRole)) {
    return fallback ?? null
  }

  return <>{children}</>
}

// Usage in routes
const routes = [
  {
    path: '/admin',
    action(context) {
      const { default: AdminLayout } = await import('./layouts/Admin')
      return (
        <Protected requiredRole="admin" fallback={<Redirect to="/login" />}>
          <AdminLayout />
        </Protected>
      )
    },
  },
]
```

## Handling Multiple Auth Strategies

Support different authentication methods:

```ts
interface AuthContext {
  // JWT token auth
  token?: string
  // Session auth
  session?: { userId: string }
  // API key auth
  apiKey?: string
}

function getUser(context: AuthContext): User | null {
  // Check JWT token
  if (context.token) {
    try {
      return verifyJWT(context.token)
    } catch {
      return null
    }
  }

  // Check session
  if (context.session) {
    return getUserById(context.session.userId)
  }

  // Check API key
  if (context.apiKey) {
    return getApiKeyUser(context.apiKey)
  }

  return null
}

const router = new UniversalRouter(routes, {
  context: {
    // Will be populated per request
  },
  resolveRoute(context, params) {
    // Resolve user from various auth methods
    context.user = context.user ?? getUser(context)
    return context.route.action?.(context, params)
  },
})
```

## Common Pitfalls

### 1. Client-Side Only Security

Never rely solely on client-side authorization:

```ts
// Wrong - easily bypassed by users
const routes = [
  {
    path: '/admin',
    action(context) {
      if (!context.user?.isAdmin) {
        return { redirect: '/login' }
      }
      // User can modify JS to skip this check
      return { content: 'Admin secrets' }
    },
  },
]

// Correct - always verify on server
app.get('/admin', authenticateMiddleware, authorizeAdmin, (req, res) => {
  // Server-side authorization check
})
```

### 2. Leaking Protected Content

Ensure protected content is not sent to unauthorized users:

```ts
// Wrong - content is in the response, just hidden
{
  path: '/admin',
  action(context) {
    const adminContent = '<h1>Admin</h1><div>Secret data</div>'
    if (!context.user?.isAdmin) {
      return { content: '<h1>Access Denied</h1>', hidden: adminContent }
    }
    return { content: adminContent }
  }
}

// Correct - only return what user should see
{
  path: '/admin',
  action(context) {
    if (!context.user?.isAdmin) {
      return { content: '<h1>Access Denied</h1>' }
    }
    return { content: '<h1>Admin</h1><div>Secret data</div>' }
  }
}
```

### 3. Not Handling All Child Routes

Ensure middleware protects ALL children:

```ts
// Wrong - action must call context.next() to protect children
{
  path: '/admin',
  action(context) {
    if (!context.user) {
      return { redirect: '/login' }
    }
    // Missing context.next() - children aren't checked!
    return undefined
  },
  children: [...]
}

// Correct
{
  path: '/admin',
  action(context) {
    if (!context.user) {
      return { redirect: '/login' }
    }
    return context.next() // Continue to children
  },
  children: [...]
}
```

### 4. Race Conditions in Auth State

Handle auth state changes during navigation:

```ts
// Problem: User logs out while page is loading
async function navigate(pathname: string) {
  const page = await router.resolve({ pathname, user: currentUser })
  // User might have logged out during the await!
  render(page)
}

// Solution: Check auth state after resolve
async function navigate(pathname: string) {
  const userAtStart = currentUser
  const page = await router.resolve({ pathname, user: userAtStart })

  // Verify user hasn't changed
  if (currentUser !== userAtStart) {
    // Re-resolve with new auth state
    return navigate(pathname)
  }

  render(page)
}
```

## See Also

- [Redirects](./redirects.md) - Redirect patterns for auth flows
- [Isomorphic Routing](./isomorphic-routing.md) - Server-side auth
- [Usage with React and Redux](./react-redux.md) - Auth state management
- [Universal Router API](./api.md) - Middleware and context
