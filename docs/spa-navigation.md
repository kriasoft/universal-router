# Single Page Application Navigation

Universal Router is designed to be framework-agnostic and does not handle browser navigation directly.
This gives you complete control over how and when routes are resolved. This recipe shows how to
integrate the router with the browser's History API for seamless SPA navigation.

## Understanding the Architecture

Unlike traditional routers that automatically listen for URL changes, Universal Router follows a
"pull" model - you call `router.resolve()` when you want to handle navigation. This design makes
the router truly universal and gives you flexibility to:

- Control exactly when routing happens
- Handle navigation differently on client and server
- Integrate with any state management solution
- Support custom navigation behaviors

## Basic History API Integration

The simplest way to handle SPA navigation is to listen for `popstate` events and intercept link clicks:

```js
import UniversalRouter from 'universal-router'

const routes = [
  { path: '/', action: () => '<h1>Home</h1>' },
  { path: '/about', action: () => '<h1>About</h1>' },
  { path: '/users/:id', action: (ctx) => `<h1>User ${ctx.params.id}</h1>` },
]

const router = new UniversalRouter(routes)

// Render function that updates the page
async function render(pathname) {
  try {
    const html = await router.resolve(pathname)
    document.getElementById('app').innerHTML = html
  } catch (error) {
    if (error.status === 404) {
      document.getElementById('app').innerHTML = '<h1>Page Not Found</h1>'
    } else {
      console.error(error)
    }
  }
}

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
  render(window.location.pathname)
})

// Handle initial page load
render(window.location.pathname)
```

## Link Interception

To enable client-side navigation for anchor tags without full page reloads:

```js
// Navigate programmatically
function navigate(pathname) {
  window.history.pushState(null, '', pathname)
  render(pathname)
}

// Intercept link clicks
document.addEventListener('click', (event) => {
  // Find the closest anchor tag
  const link = event.target.closest('a')
  if (!link) return

  // Skip if modifier keys are pressed (open in new tab, etc.)
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

  // Skip external links
  if (link.hostname !== window.location.hostname) return

  // Skip links with target attribute
  if (link.target && link.target !== '_self') return

  // Skip download links
  if (link.hasAttribute('download')) return

  // Skip hash-only links (same-page anchors)
  if (link.pathname === window.location.pathname && link.hash) return

  // Prevent default and navigate
  event.preventDefault()
  navigate(link.pathname + link.search + link.hash)
})
```

## Complete Navigation Module

Here's a complete, reusable navigation module for SPAs:

```ts
import UniversalRouter, { Route, RouteContext } from 'universal-router'

interface NavigationOptions {
  router: UniversalRouter
  render: (result: unknown) => void
  onError?: (error: Error & { status?: number }) => void
}

interface NavigateOptions {
  replace?: boolean
  state?: unknown
}

function createNavigation({ router, render, onError }: NavigationOptions) {
  let currentPathname = ''

  async function handleNavigation(pathname: string) {
    if (pathname === currentPathname) return
    currentPathname = pathname

    try {
      const result = await router.resolve(pathname)
      render(result)
    } catch (error) {
      if (onError) {
        onError(error as Error & { status?: number })
      } else {
        throw error
      }
    }
  }

  function navigate(pathname: string, options: NavigateOptions = {}) {
    const { replace = false, state = null } = options

    if (replace) {
      window.history.replaceState(state, '', pathname)
    } else {
      window.history.pushState(state, '', pathname)
    }

    handleNavigation(pathname)
  }

  function start() {
    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      handleNavigation(window.location.pathname)
    })

    // Intercept link clicks
    document.addEventListener('click', (event) => {
      const link = (event.target as Element).closest('a')
      if (!link) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return
      if (link.hostname !== window.location.hostname) return
      if (link.target && link.target !== '_self') return
      if (link.hasAttribute('download')) return
      if (link.pathname === window.location.pathname && link.hash) return

      event.preventDefault()
      navigate(link.pathname + link.search + link.hash)
    })

    // Handle initial navigation
    handleNavigation(window.location.pathname)
  }

  return { navigate, start }
}

// Usage
const router = new UniversalRouter(routes)

const navigation = createNavigation({
  router,
  render: (html) => {
    document.getElementById('app')!.innerHTML = html as string
  },
  onError: (error) => {
    if (error.status === 404) {
      document.getElementById('app')!.innerHTML = '<h1>Page Not Found</h1>'
    }
  },
})

navigation.start()

// Navigate programmatically from anywhere
navigation.navigate('/users/123')
navigation.navigate('/login', { replace: true }) // Replace current history entry
```

## Using the History Library

For more robust history management, use the [history](https://github.com/remix-run/history) library:

```js
import UniversalRouter from 'universal-router'
import { createBrowserHistory } from 'history'

const history = createBrowserHistory()
const router = new UniversalRouter(routes)

async function render(location) {
  const result = await router.resolve(location.pathname)
  document.getElementById('app').innerHTML = result
}

// Listen for location changes
history.listen(({ location }) => {
  render(location)
})

// Initial render
render(history.location)

// Navigate programmatically
history.push('/about')
history.replace('/login')
history.back()
```

## Handling Page Reload

When users reload the page, your server must be configured to serve the same HTML for all routes.
This is because the browser requests the current URL from the server, not just the root.

For development servers:

**Vite (vite.config.js):**

```js
export default {
  server: {
    // Fallback to index.html for SPA routing
    historyApiFallback: true,
  },
}
```

**Webpack Dev Server (webpack.config.js):**

```js
module.exports = {
  devServer: {
    historyApiFallback: true,
  },
}
```

For production, configure your web server (nginx, Apache, etc.) to serve `index.html` for all routes:

**nginx:**

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Express:**

```js
const express = require('express')
const path = require('path')

const app = express()

// Serve static files
app.use(express.static('dist'))

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(3000)
```

## Scroll Restoration

Browsers automatically manage scroll position for traditional navigation but not for SPA navigation.
Handle this manually:

```js
// Store scroll positions
const scrollPositions = new Map()

function navigate(pathname, options = {}) {
  // Save current scroll position before navigating
  scrollPositions.set(window.location.pathname, {
    x: window.scrollX,
    y: window.scrollY,
  })

  if (options.replace) {
    window.history.replaceState(null, '', pathname)
  } else {
    window.history.pushState(null, '', pathname)
  }

  render(pathname).then(() => {
    if (options.scrollToTop !== false) {
      window.scrollTo(0, 0)
    }
  })
}

// Restore scroll on back/forward
window.addEventListener('popstate', async () => {
  const pathname = window.location.pathname
  await render(pathname)

  const savedPosition = scrollPositions.get(pathname)
  if (savedPosition) {
    window.scrollTo(savedPosition.x, savedPosition.y)
  }
})
```

## Query String Handling

Universal Router focuses on pathname matching. Handle query strings separately:

```js
import UniversalRouter from 'universal-router'

const routes = [
  {
    path: '/search',
    action(context) {
      // Access query params from the context you passed
      const query = context.query || {}
      return `<h1>Search results for: ${query.q || ''}</h1>`
    },
  },
]

const router = new UniversalRouter(routes)

async function render(pathname) {
  const url = new URL(pathname, window.location.origin)
  const query = Object.fromEntries(url.searchParams)

  const result = await router.resolve({
    pathname: url.pathname,
    query, // Pass query params as context
  })

  document.getElementById('app').innerHTML = result
}
```

## Common Pitfalls

### 1. Forgetting Initial Render

Always render on page load, not just on navigation:

```js
// Wrong - only handles navigation, not initial load
window.addEventListener('popstate', () => render(window.location.pathname))

// Correct - handle both
window.addEventListener('popstate', () => render(window.location.pathname))
render(window.location.pathname) // Initial render
```

### 2. Not Handling Hash Links

Hash-only links should scroll to elements, not trigger routing:

```js
document.addEventListener('click', (event) => {
  const link = event.target.closest('a')
  if (!link) return

  // Let hash-only links work normally
  if (link.pathname === window.location.pathname && link.hash) {
    return // Don't prevent default
  }

  // Handle other links...
})
```

### 3. Memory Leaks from Event Listeners

Clean up listeners when appropriate (e.g., in component unmount):

```js
function createNavigation(router) {
  const handlePopState = () => render(window.location.pathname)
  const handleClick = (event) => {
    /* ... */
  }

  return {
    start() {
      window.addEventListener('popstate', handlePopState)
      document.addEventListener('click', handleClick)
    },
    stop() {
      window.removeEventListener('popstate', handlePopState)
      document.removeEventListener('click', handleClick)
    },
  }
}
```

## See Also

- [Isomorphic Routing](./isomorphic-routing.md) - Server-side rendering with client hydration
- [Redirects](./redirects.md) - Handling redirects in SPAs
- [Usage with React and Redux](./react-redux.md) - State management integration
- [Universal Router API](./api.md) - Complete API reference
