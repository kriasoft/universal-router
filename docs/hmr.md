# Hot Module Replacement (HMR)

Hot Module Replacement allows you to update code during development without losing
application state or requiring a full page reload. Universal Router works well with
HMR, but requires some setup to handle route updates properly.

## How HMR Works with Universal Router

When your route files change, HMR replaces the old modules with new ones. The challenge
is updating the router instance with the new routes. There are two main approaches:

1. **Recreate the router instance** - Simple and reliable
2. **Replace the routes in place** - Preserves router state

For most applications, recreating the router instance is recommended because it's
simpler and Universal Router instances are stateless (aside from route caching).

## Vite HMR Setup (Recommended)

Vite is the modern standard for frontend tooling. It uses native ES modules and
provides faster HMR than Webpack. Use `import.meta.hot` for HMR handling.

### Basic Setup

```ts
// routes.ts
const routes = [
  { path: '/', action: () => import('./pages/Home') },
  { path: '/about', action: () => import('./pages/About') },
]

export default routes
```

```ts
// router.ts
import UniversalRouter from 'universal-router'
import routes from './routes'

let router = new UniversalRouter(routes)

export function getRouter() {
  return router
}

export function updateRoutes(newRoutes: typeof routes) {
  router = new UniversalRouter(newRoutes)
}

// Vite HMR - use import.meta.hot (ESM syntax)
if (import.meta.hot) {
  import.meta.hot.accept('./routes', (newModule) => {
    if (newModule) {
      updateRoutes(newModule.default)
      console.log('[HMR] Routes updated')
      // Trigger re-render
      window.dispatchEvent(new CustomEvent('routes-updated'))
    }
  })
}
```

```ts
// main.ts
import { getRouter } from './router'

async function render() {
  const router = getRouter()
  const result = await router.resolve(window.location.pathname)
  document.getElementById('app')!.innerHTML = result
}

// Initial render
render()

// Re-render on HMR
window.addEventListener('routes-updated', render)

// Re-render on navigation
window.addEventListener('popstate', render)
```

## Webpack HMR Setup (Legacy)

For projects still using Webpack, use `module.hot` for HMR handling.

### Basic Setup

```ts
// routes.ts
import UniversalRouter from 'universal-router'

const routes = [
  { path: '/', action: () => import('./pages/Home') },
  { path: '/about', action: () => import('./pages/About') },
  { path: '/dashboard', action: () => import('./pages/Dashboard') },
]

export default routes
```

```ts
// router.ts
import UniversalRouter from 'universal-router'
import routes from './routes'

let router = new UniversalRouter(routes)

export function getRouter() {
  return router
}

// Webpack HMR - use module.hot (CommonJS syntax)
if (module.hot) {
  module.hot.accept('./routes', () => {
    const nextRoutes = require('./routes').default
    router = new UniversalRouter(nextRoutes)
    console.log('[HMR] Routes updated')
  })
}
```

```ts
// client.ts
import { getRouter } from './router'

async function render(pathname: string) {
  const router = getRouter()
  const result = await router.resolve(pathname)
  document.getElementById('app')!.innerHTML = result
}

// Initial render
render(window.location.pathname)

// Re-render on route changes
window.addEventListener('popstate', () => {
  render(window.location.pathname)
})

// Re-render on HMR update
if (module.hot) {
  module.hot.accept('./router', () => {
    render(window.location.pathname)
  })
}
```

### With React (Webpack)

For React applications using Webpack, combine HMR with React's rendering:

```tsx
// App.tsx
import { useState, useEffect, useCallback } from 'react'
import UniversalRouter from 'universal-router'
import routes from './routes'

let router = new UniversalRouter(routes)

export default function App() {
  const [content, setContent] = useState<React.ReactNode>(null)
  const [pathname, setPathname] = useState(window.location.pathname)

  const navigate = useCallback(async (path: string) => {
    const result = await router.resolve(path)
    setContent(result)
    setPathname(path)
  }, [])

  useEffect(() => {
    navigate(window.location.pathname)
  }, [navigate])

  useEffect(() => {
    const handlePopState = () => navigate(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [navigate])

  return <div id="app">{content}</div>
}

// Webpack HMR for routes
if (module.hot) {
  module.hot.accept('./routes', () => {
    const nextRoutes = require('./routes').default
    router = new UniversalRouter(nextRoutes)
    // Trigger re-render by navigating to current path
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
}
```

### Preserving Router State

If you need to preserve router state (like cached match functions), you can
replace routes in place:

```ts
// router.ts
import UniversalRouter from 'universal-router'
import routes from './routes'

const router = new UniversalRouter(routes)

export default router

if (module.hot) {
  module.hot.accept('./routes', () => {
    const nextRoutes = require('./routes').default

    // Replace the root route's children
    // This preserves any router-level state
    router.root = Array.isArray(nextRoutes)
      ? { path: '', children: nextRoutes, parent: null }
      : nextRoutes
    router.root.parent = null

    console.log('[HMR] Routes replaced')
  })
}
```

## Dynamic Imports and HMR

When using code-splitting with dynamic imports, HMR for page components works
automatically because the imports are re-executed:

```ts
// routes.ts
const routes = [
  {
    path: '/dashboard',
    async action() {
      // This import is re-executed on HMR, loading the updated module
      const { default: Dashboard } = await import('./pages/Dashboard')
      return <Dashboard />
    },
  },
]
```

This works because:

1. When `Dashboard.tsx` changes, Vite/Webpack invalidates that module
2. The next time `/dashboard` is visited, the import fetches the new module
3. No special HMR handling needed for the page component itself

### Immediate Updates for Dynamic Routes

If you want changes to reflect immediately (without re-navigating), add HMR
handling in the page component:

```tsx
// pages/Dashboard.tsx
export default function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    // Fetch data...
  }, [])

  return <div>Dashboard content</div>
}

// This makes the component update in place on HMR
if (import.meta.hot) {
  import.meta.hot.accept()
}
```

## Context and State Preservation

Preserve context data across HMR updates:

```ts
// context.ts
// This module is not accepted by HMR, so it persists across updates
export const appContext = {
  user: null as User | null,
  theme: 'light' as 'light' | 'dark',
  locale: 'en',
}

export function setUser(user: User | null) {
  appContext.user = user
}
```

```ts
// router.ts
import UniversalRouter from 'universal-router'
import routes from './routes'
import { appContext } from './context'

let router = new UniversalRouter(routes, {
  context: appContext,
})

export function getRouter() {
  return router
}

if (import.meta.hot) {
  import.meta.hot.accept('./routes', (newModule) => {
    if (newModule) {
      // Context is preserved because it's in a separate module
      router = new UniversalRouter(newModule.default, {
        context: appContext,
      })
      window.dispatchEvent(new CustomEvent('routes-updated'))
    }
  })
}
```

## Development vs Production

Ensure HMR code is stripped in production builds:

```ts
// router.ts
import UniversalRouter from 'universal-router'
import routes from './routes'

let router = new UniversalRouter(routes)

export function getRouter() {
  return router
}

// This entire block is removed in production builds
if (import.meta.env.DEV && import.meta.hot) {
  import.meta.hot.accept('./routes', (newModule) => {
    if (newModule) {
      router = new UniversalRouter(newModule.default)
      window.dispatchEvent(new CustomEvent('routes-updated'))
    }
  })
}
```

For Webpack:

```ts
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./routes', () => {
    const nextRoutes = require('./routes').default
    router = new UniversalRouter(nextRoutes)
  })
}
```

## Full Example: Vite + React + TypeScript

Here's a complete example with all pieces together:

```ts
// src/routes.tsx
import type { ReactNode } from 'react'
import type { Route } from 'universal-router'

const routes: Route<ReactNode>[] = [
  {
    path: '/',
    async action() {
      const { default: Home } = await import('./pages/Home')
      return <Home />
    },
  },
  {
    path: '/about',
    async action() {
      const { default: About } = await import('./pages/About')
      return <About />
    },
  },
  {
    path: '/users/:id',
    async action(context) {
      const { default: UserProfile } = await import('./pages/UserProfile')
      return <UserProfile userId={context.params.id as string} />
    },
  },
]

export default routes
```

```tsx
// src/router.ts
import UniversalRouter from 'universal-router'
import type { ReactNode } from 'react'
import routes from './routes'

let router = new UniversalRouter<ReactNode>(routes)

export function getRouter() {
  return router
}

// Development-only HMR
if (import.meta.env.DEV && import.meta.hot) {
  import.meta.hot.accept('./routes', (newModule) => {
    if (newModule) {
      router = new UniversalRouter<ReactNode>(newModule.default)
      window.dispatchEvent(new CustomEvent('routes-updated'))
      console.log('[HMR] Routes updated')
    }
  })
}
```

```tsx
// src/App.tsx
import { useState, useEffect, useCallback } from 'react'
import { getRouter } from './router'

export default function App() {
  const [content, setContent] = useState<React.ReactNode>(null)
  const [error, setError] = useState<string | null>(null)

  const navigate = useCallback(async (pathname: string) => {
    try {
      setError(null)
      const result = await getRouter().resolve(pathname)
      setContent(result)
    } catch (err: any) {
      if (err.status === 404) {
        setError('Page not found')
      } else {
        setError('An error occurred')
        console.error(err)
      }
    }
  }, [])

  useEffect(() => {
    // Initial navigation
    navigate(window.location.pathname)

    // Handle browser back/forward
    const handlePopState = () => navigate(window.location.pathname)
    window.addEventListener('popstate', handlePopState)

    // Handle HMR route updates
    const handleRoutesUpdated = () => navigate(window.location.pathname)
    window.addEventListener('routes-updated', handleRoutesUpdated)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('routes-updated', handleRoutesUpdated)
    }
  }, [navigate])

  if (error) {
    return <div className="error">{error}</div>
  }

  return <>{content}</>
}
```

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

## Common Pitfalls

### 1. Module Cache Issues

Old module references might be cached. Ensure you're getting fresh imports:

```ts
// Wrong - might use cached module
import routes from './routes'
let router = new UniversalRouter(routes)

if (module.hot) {
  module.hot.accept('./routes', () => {
    // 'routes' still points to old module!
    router = new UniversalRouter(routes)
  })
}

// Correct - use require to get fresh module
if (module.hot) {
  module.hot.accept('./routes', () => {
    const nextRoutes = require('./routes').default
    router = new UniversalRouter(nextRoutes)
  })
}
```

### 2. Not Re-rendering After Update

Creating a new router isn't enough - you need to trigger a re-render:

```ts
// Wrong - updates router but page shows old content
if (module.hot) {
  module.hot.accept('./routes', () => {
    router = new UniversalRouter(require('./routes').default)
  })
}

// Correct - trigger re-render
if (module.hot) {
  module.hot.accept('./routes', () => {
    router = new UniversalRouter(require('./routes').default)
    // Trigger re-render
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
}
```

### 3. Circular Dependencies

HMR can expose circular dependency issues. Keep router creation separate:

```ts
// Bad - circular dependency risk
// routes.ts imports components that import routes.ts

// Good - separate concerns
// routes.ts only defines route structure
// router.ts creates the router instance
// components.ts contains components
```

### 4. Memory Leaks from Event Listeners

Clean up event listeners in HMR:

```ts
let cleanupFn: (() => void) | null = null

function setup() {
  const handler = () => {
    /* ... */
  }
  window.addEventListener('popstate', handler)

  // Return cleanup function
  return () => window.removeEventListener('popstate', handler)
}

cleanupFn = setup()

if (module.hot) {
  module.hot.dispose(() => {
    // Clean up before module is replaced
    cleanupFn?.()
  })
}
```

## See Also

- [Code Splitting](./code-splitting.md) - Lazy loading routes
- [SPA Navigation](./spa-navigation.md) - Client-side routing
- [Getting Started](./getting-started.md) - Basic setup
