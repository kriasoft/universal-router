# Code Splitting and Lazy Loading Routes

Code splitting allows you to load route components on demand, reducing your initial bundle size
and improving application startup time. Universal Router works seamlessly with dynamic imports
and any bundler that supports them.

## Why Code Split Routes?

Without code splitting, your entire application is bundled into a single JavaScript file.
Users download everything upfront, even pages they may never visit:

```
Before: main.js (500KB) - includes all pages
After:  main.js (50KB) + home.js (30KB) + about.js (20KB) + admin.js (400KB)
```

With route-based code splitting:

- Initial load is faster (smaller bundle)
- Users only download code for pages they visit
- Admin-heavy features don't slow down regular users

## Basic Dynamic Imports

The simplest approach uses `import()` inside route actions:

```js
import UniversalRouter from 'universal-router'

const routes = [
  {
    path: '/',
    async action() {
      const { default: Home } = await import('./pages/Home')
      return Home
    },
  },
  {
    path: '/about',
    async action() {
      const { default: About } = await import('./pages/About')
      return About
    },
  },
  {
    path: '/admin',
    async action() {
      // This 400KB admin bundle only loads when visiting /admin
      const { default: Admin } = await import('./pages/Admin')
      return Admin
    },
  },
]

const router = new UniversalRouter(routes)

router.resolve('/admin').then((Page) => {
  // Admin module is now loaded
  document.getElementById('app').innerHTML = Page()
})
```

## Loading States

Show a loading indicator while chunks are being fetched:

```tsx
import UniversalRouter from 'universal-router'
import type { ReactNode } from 'react'

interface PageResult {
  component: ReactNode
  loading?: ReactNode
}

const routes = [
  {
    path: '/dashboard',
    async action(): Promise<PageResult> {
      const { default: Dashboard } = await import('./pages/Dashboard')
      return {
        component: <Dashboard />,
      }
    },
  },
]

const router = new UniversalRouter<PageResult>(routes)

async function navigate(pathname: string) {
  const container = document.getElementById('app')!

  // Show loading state immediately
  container.innerHTML = '<div class="loading">Loading...</div>'

  try {
    const page = await router.resolve(pathname)
    // Replace with actual content
    render(page.component, container)
  } catch (error) {
    container.innerHTML = '<div class="error">Failed to load page</div>'
  }
}
```

## React Suspense Integration

For React applications, integrate with Suspense for declarative loading states:

```tsx
import { lazy, Suspense, ReactNode } from 'react'
import UniversalRouter from 'universal-router'

// Create lazy components
const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Dashboard = lazy(() => import('./pages/Dashboard'))

const routes = [
  {
    path: '/',
    action: () => <Home />,
  },
  {
    path: '/about',
    action: () => <About />,
  },
  {
    path: '/dashboard',
    action: () => <Dashboard />,
  },
]

const router = new UniversalRouter<ReactNode>(routes)

// Wrap rendering in Suspense
function App() {
  const [content, setContent] = useState<ReactNode>(null)

  useEffect(() => {
    router.resolve(window.location.pathname).then(setContent)
  }, [])

  return <Suspense fallback={<div>Loading...</div>}>{content}</Suspense>
}
```

## Route-Level Loading Components

Define custom loading states per route:

```tsx
interface RouteConfig {
  path: string
  load: () => Promise<{ default: React.ComponentType }>
  loading?: React.ReactNode
}

const routeConfigs: RouteConfig[] = [
  {
    path: '/',
    load: () => import('./pages/Home'),
    loading: <HomeSkeleton />,
  },
  {
    path: '/dashboard',
    load: () => import('./pages/Dashboard'),
    loading: <DashboardSkeleton />,
  },
  {
    path: '/settings',
    load: () => import('./pages/Settings'),
    loading: <SettingsSkeleton />,
  },
]

// Convert to Universal Router routes
const routes = routeConfigs.map((config) => ({
  path: config.path,
  async action() {
    const module = await config.load()
    return {
      Component: module.default,
      loading: config.loading,
    }
  },
}))
```

## Preloading Routes

Preload routes before users navigate to improve perceived performance:

```tsx
// Create a preload map
const preloadMap = new Map<string, Promise<unknown>>()

const routes = [
  {
    path: '/dashboard',
    // Store the import promise for preloading
    load: () => import('./pages/Dashboard'),
    async action() {
      // Use preloaded module if available, otherwise load fresh
      const existing = preloadMap.get('/dashboard')
      const module = existing
        ? await existing
        : await import('./pages/Dashboard')
      return <module.default />
    },
  },
]

// Preload function to call on hover or other triggers
function preload(path: string) {
  const route = routes.find((r) => r.path === path && r.load)
  if (route && !preloadMap.has(path)) {
    preloadMap.set(path, route.load())
  }
}

// Preload on link hover
document.addEventListener('mouseover', (event) => {
  const link = (event.target as Element).closest('a')
  if (link && link.hostname === window.location.hostname) {
    preload(link.pathname)
  }
})

// Preload on link focus (keyboard navigation)
document.addEventListener('focusin', (event) => {
  const link = (event.target as Element).closest('a')
  if (link && link.hostname === window.location.hostname) {
    preload(link.pathname)
  }
})
```

## Webpack Configuration

Webpack automatically code-splits on dynamic imports. Configure chunk names for better debugging:

```js
// routes.js
const routes = [
  {
    path: '/admin',
    async action() {
      // webpackChunkName creates a named chunk: admin.js
      const { default: Admin } = await import(
        /* webpackChunkName: "admin" */ './pages/Admin'
      )
      return Admin
    },
  },
  {
    path: '/reports',
    async action() {
      // Group related chunks together
      const { default: Reports } = await import(
        /* webpackChunkName: "admin" */ './pages/Reports'
      )
      return Reports
    },
  },
]
```

```js
// webpack.config.js
module.exports = {
  output: {
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      // Create separate chunks for large dependencies
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
}
```

## Vite Configuration

Vite handles code splitting automatically with dynamic imports:

```ts
// routes.ts
const routes = [
  {
    path: '/admin',
    async action() {
      const { default: Admin } = await import('./pages/Admin')
      return Admin
    },
  },
]
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Customize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        // Manual chunk splitting
        manualChunks: {
          // Put large libraries in separate chunks
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
})
```

## Error Handling for Failed Chunks

Handle network errors when loading chunks:

```tsx
async function loadWithRetry<T>(
  load: () => Promise<T>,
  retries = 3,
  delay = 1000,
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await load()
    } catch (error) {
      if (attempt === retries) throw error

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, delay * attempt))

      // Clear module cache (for Vite/Webpack)
      console.warn(`Retrying chunk load (attempt ${attempt + 1})`)
    }
  }
  throw new Error('Failed to load chunk')
}

const routes = [
  {
    path: '/dashboard',
    async action() {
      try {
        const module = await loadWithRetry(() => import('./pages/Dashboard'))
        return <module.default />
      } catch (error) {
        // Return error component or redirect
        return <ChunkLoadError onRetry={() => navigate('/dashboard')} />
      }
    },
  },
]
```

## Prefetching with Intersection Observer

Prefetch chunks when links become visible:

```tsx
function usePrefetchOnVisible(paths: string[]) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement
            preload(link.pathname)
            observer.unobserve(link)
          }
        })
      },
      { rootMargin: '100px' }, // Prefetch when 100px from viewport
    )

    paths.forEach((path) => {
      const link = document.querySelector(`a[href="${path}"]`)
      if (link) observer.observe(link)
    })

    return () => observer.disconnect()
  }, [paths])
}
```

## Server-Side Rendering Considerations

When using SSR with code splitting, ensure chunks are preloaded on the client:

```tsx
// server.tsx
import { renderToString } from 'react-dom/server'

app.get('*', async (req, res) => {
  const router = new UniversalRouter(routes)
  const page = await router.resolve(req.path)

  const html = renderToString(page.component)

  // Track which chunks were used during rendering
  const usedChunks = collectChunks() // Implementation depends on your setup

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        ${usedChunks
          .map((chunk) => `<link rel="modulepreload" href="${chunk}" />`)
          .join('\n')}
      </head>
      <body>
        <div id="root">${html}</div>
        <script type="module" src="/client.js"></script>
      </body>
    </html>
  `)
})
```

## Common Pitfalls

### 1. Importing at Module Level

Dynamic imports must be inside functions to enable code splitting:

```js
// Wrong - imports at module level, no code splitting
import Admin from './pages/Admin'
const routes = [{ path: '/admin', action: () => <Admin /> }]

// Correct - dynamic import in action
const routes = [
  {
    path: '/admin',
    async action() {
      const { default: Admin } = await import('./pages/Admin')
      return <Admin />
    },
  },
]
```

### 2. Not Handling Loading States

Users see a blank screen while chunks load:

```js
// Wrong - no loading feedback
async function navigate(path) {
  const page = await router.resolve(path)
  render(page)
}

// Correct - show loading state
async function navigate(path) {
  showLoadingIndicator()
  try {
    const page = await router.resolve(path)
    render(page)
  } finally {
    hideLoadingIndicator()
  }
}
```

### 3. Over-Splitting

Too many small chunks can hurt performance due to HTTP overhead:

```js
// Probably too granular - each tiny component is its own chunk
const Button = lazy(() => import('./Button'))
const Icon = lazy(() => import('./Icon'))

// Better - split at route level, not component level
const Dashboard = lazy(() => import('./pages/Dashboard'))
```

### 4. Duplicate Dependencies in Chunks

Ensure shared dependencies are extracted:

```js
// webpack.config.js
optimization: {
  splitChunks: {
    cacheGroups: {
      // Extract shared dependencies into a common chunk
      common: {
        name: 'common',
        minChunks: 2, // Used by at least 2 chunks
        chunks: 'all',
        priority: -10,
      },
    },
  },
}
```

## See Also

- [SPA Navigation](./spa-navigation.md) - Client-side routing basics
- [Isomorphic Routing](./isomorphic-routing.md) - Server-side rendering
- [Universal Router API](./api.md) - Complete API reference
