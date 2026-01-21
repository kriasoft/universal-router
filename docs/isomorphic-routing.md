# Isomorphic Routing with React and Express

Universal Router is designed to work identically on both server and client, making it ideal for
isomorphic (universal) applications. This recipe shows how to share routes between Node.js and
the browser, implement server-side rendering with React, and hydrate on the client.

## What is Isomorphic Routing?

Isomorphic routing means using the same route definitions and routing logic on both:

- **Server**: Render the initial HTML for SEO, performance, and users without JavaScript
- **Client**: Handle subsequent navigation without full page reloads

Universal Router excels at this because:

1. It has no browser-specific dependencies
2. Route definitions are plain JavaScript objects
3. Actions can return anything (strings, React elements, data, etc.)
4. The same `router.resolve()` call works everywhere

## Project Structure

A typical isomorphic React app structure:

```
src/
  routes.ts          # Shared route definitions
  App.tsx            # Root React component
  client.tsx         # Client entry point
  server.tsx         # Server entry point
  pages/
    Home.tsx
    About.tsx
    User.tsx
```

## Shared Route Definitions

Define routes once, use everywhere:

```tsx
// src/routes.ts
import type { Route, RouteContext } from 'universal-router'
import type { ReactNode } from 'react'

// Define your context type
export interface AppContext {
  pathname: string
  query?: Record<string, string>
  user?: { id: string; name: string } | null
}

// Route result type
export interface PageResult {
  title: string
  component: ReactNode
  data?: unknown
}

export type AppRoute = Route<PageResult, AppContext>

const routes: AppRoute[] = [
  {
    path: '/',
    async action() {
      const { default: Home } = await import('./pages/Home')
      return {
        title: 'Home',
        component: <Home />,
      }
    },
  },
  {
    path: '/about',
    async action() {
      const { default: About } = await import('./pages/About')
      return {
        title: 'About Us',
        component: <About />,
      }
    },
  },
  {
    path: '/users/:id',
    async action(context) {
      const { default: User } = await import('./pages/User')
      const userId = context.params.id as string

      // Fetch data - works on both server and client
      const response = await fetch(`https://api.example.com/users/${userId}`)
      const user = await response.json()

      return {
        title: `User: ${user.name}`,
        component: <User user={user} />,
        data: user,
      }
    },
  },
]

export default routes
```

## Server-Side Rendering with Express

```tsx
// src/server.tsx
import express from 'express'
import { renderToString } from 'react-dom/server'
import UniversalRouter from 'universal-router'
import routes, { AppContext, PageResult } from './routes'

const app = express()

// Serve static assets
app.use('/static', express.static('dist/static'))

// Handle all routes
app.get('*', async (req, res) => {
  const router = new UniversalRouter<PageResult, AppContext>(routes)

  try {
    // Create context with request data
    const context: AppContext = {
      pathname: req.path,
      query: req.query as Record<string, string>,
      user: req.user || null, // From auth middleware
    }

    // Resolve the route
    const page = await router.resolve(context)

    // Render React component to string
    const html = renderToString(page.component)

    // Send the complete HTML page
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${page.title}</title>
          <link rel="stylesheet" href="/static/styles.css">
        </head>
        <body>
          <div id="root">${html}</div>
          <script>
            window.__INITIAL_DATA__ = ${JSON.stringify(page.data || null)};
            window.__INITIAL_PATH__ = ${JSON.stringify(req.path)};
          </script>
          <script src="/static/client.js"></script>
        </body>
      </html>
    `)
  } catch (error: any) {
    if (error.status === 404) {
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Not Found</title></head>
          <body>
            <h1>Page Not Found</h1>
            <a href="/">Go Home</a>
          </body>
        </html>
      `)
    } else {
      console.error('Routing error:', error)
      res.status(500).send('Internal Server Error')
    }
  }
})

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

## Client-Side Hydration

```tsx
// src/client.tsx
import { hydrateRoot } from 'react-dom/client'
import UniversalRouter from 'universal-router'
import routes, { AppContext, PageResult } from './routes'

const router = new UniversalRouter<PageResult, AppContext>(routes)
const container = document.getElementById('root')!

// Track current render for preventing stale updates
let currentRender = 0

// IMPORTANT: Create the root ONCE and store it for reuse
// Creating a new root on every navigation causes memory leaks and breaks React state
let root: ReturnType<typeof hydrateRoot> | null = null

async function render(pathname: string, isInitial = false) {
  const renderVersion = ++currentRender

  try {
    const context: AppContext = {
      pathname,
      query: Object.fromEntries(new URLSearchParams(window.location.search)),
    }

    const page = await router.resolve(context)

    // Prevent rendering if a newer navigation started
    if (renderVersion !== currentRender) return

    document.title = page.title

    if (isInitial) {
      // Hydrate server-rendered HTML and store the root
      root = hydrateRoot(container, page.component)
    } else if (root) {
      // Reuse the existing root for subsequent navigations
      root.render(page.component)
    }
  } catch (error: any) {
    if (renderVersion !== currentRender) return

    if (error.status === 404) {
      document.title = 'Not Found'
      root?.render(<h1>Page Not Found</h1>)
    } else {
      throw error
    }
  }
}

// Navigation functions
function navigate(pathname: string, options: { replace?: boolean } = {}) {
  if (options.replace) {
    window.history.replaceState(null, '', pathname)
  } else {
    window.history.pushState(null, '', pathname)
  }
  render(pathname)
}

// Handle back/forward
window.addEventListener('popstate', () => {
  render(window.location.pathname)
})

// Intercept link clicks
document.addEventListener('click', (event) => {
  const link = (event.target as Element).closest('a')
  if (!link) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  if (link.hostname !== window.location.hostname) return
  if (link.target && link.target !== '_self') return

  event.preventDefault()
  navigate(link.pathname + link.search)
})

// Initial hydration
render(window.location.pathname, true)

// Export for programmatic navigation
;(window as any).navigate = navigate
```

## Data Fetching Strategies

### Strategy 1: Fetch in Route Actions

Fetch data in the action and pass it to the component:

```tsx
const routes = [
  {
    path: '/posts/:id',
    async action(context) {
      const { default: Post } = await import('./pages/Post')

      // Fetch data server or client
      const post = await fetchPost(context.params.id)

      return {
        title: post.title,
        component: <Post post={post} />,
        data: post, // Serialize for client
      }
    },
  },
]
```

### Strategy 2: Fetch on Client Only

For data that should always be fresh:

```tsx
// pages/Dashboard.tsx
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats().then((data) => {
      setStats(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <div>Loading...</div>
  return <div>{/* render stats */}</div>
}
```

### Strategy 3: Hybrid with Initial Data

Pass server-fetched data to avoid client refetch:

```tsx
// Server passes initial data via window.__INITIAL_DATA__

// pages/User.tsx
import { useState, useEffect } from 'react'

interface UserProps {
  user?: User
  userId: string
}

export default function UserPage({ user: initialUser, userId }: UserProps) {
  const [user, setUser] = useState(initialUser)
  const [loading, setLoading] = useState(!initialUser)

  useEffect(() => {
    // Only fetch if no initial data
    if (!initialUser) {
      fetchUser(userId).then((data) => {
        setUser(data)
        setLoading(false)
      })
    }
  }, [initialUser, userId])

  if (loading) return <div>Loading...</div>
  return <div>{user.name}</div>
}
```

## Handling Redirects

Handle redirects consistently on server and client:

```tsx
// routes.ts
const routes = [
  {
    path: '/old-path',
    action() {
      return { redirect: '/new-path' }
    },
  },
  {
    path: '/dashboard',
    action(context) {
      if (!context.user) {
        return { redirect: '/login' }
      }
      // ... render dashboard
    },
  },
]

// server.tsx
const page = await router.resolve(context)

if (page.redirect) {
  res.redirect(302, page.redirect)
  return
}

// Render normally...

// client.tsx
const page = await router.resolve(context)

if (page.redirect) {
  navigate(page.redirect, { replace: true })
  return
}

// Render normally...
```

## Environment-Specific Code

Use conditional imports or environment checks for code that differs:

```tsx
// routes.ts
const routes = [
  {
    path: '/api-test',
    async action() {
      // Use different base URL on server vs client
      const baseUrl =
        typeof window === 'undefined'
          ? 'http://localhost:3000' // Server
          : '' // Client (relative)

      const data = await fetch(`${baseUrl}/api/data`).then((r) => r.json())

      return { component: <div>{JSON.stringify(data)}</div> }
    },
  },
]
```

## Common Pitfalls

### 1. Hydration Mismatch

Server and client must render identical HTML initially:

```tsx
// Wrong - different output on server vs client
function Component() {
  const [time] = useState(new Date().toISOString())
  return <div>{time}</div> // Different on each render!
}

// Correct - use useEffect for client-only values
function Component() {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    setTime(new Date().toISOString())
  }, [])

  return <div>{time ?? 'Loading...'}</div>
}
```

### 2. Not Awaiting Async Actions

Server must wait for all data before rendering:

```tsx
// Wrong - renders before data loads
const page = router.resolve(pathname) // Missing await!

// Correct
const page = await router.resolve(pathname)
```

### 3. Browser APIs on Server

Guard browser-specific code:

```tsx
function Component() {
  // Wrong - crashes on server
  const width = window.innerWidth

  // Correct
  const [width, setWidth] = useState(0)

  useEffect(() => {
    setWidth(window.innerWidth)
  }, [])

  return <div>Width: {width}</div>
}
```

### 4. Memory Leaks on Server

Create a new router instance per request to avoid state leakage:

```tsx
// Wrong - shared router accumulates state
const router = new UniversalRouter(routes)

app.get('*', async (req, res) => {
  const page = await router.resolve(req.path)
})

// Correct - new router per request
app.get('*', async (req, res) => {
  const router = new UniversalRouter(routes, {
    context: { user: req.user },
  })
  const page = await router.resolve(req.path)
})
```

## TypeScript Configuration

For isomorphic TypeScript projects:

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## See Also

- [SPA Navigation](./spa-navigation.md) - Client-only navigation
- [Code Splitting](./code-splitting.md) - Lazy loading routes
- [Redirects](./redirects.md) - Server and client redirects
- [Universal Router API](./api.md) - Complete API reference
