# Handling 404 Not Found Pages

When no route matches a URL or all matched routes return `null` or `undefined`, Universal Router
throws an error with `status: 404`. This recipe covers different strategies for handling
not-found scenarios gracefully.

## Default Behavior

By default, the router throws an error when no route matches:

```js
import UniversalRouter from 'universal-router'

const router = new UniversalRouter([
  { path: '/', action: () => 'Home' },
  { path: '/about', action: () => 'About' },
])

try {
  await router.resolve('/nonexistent')
} catch (error) {
  console.log(error.message) // 'Route not found'
  console.log(error.status) // 404
}
```

## Using errorHandler Option

The `errorHandler` option provides a clean way to handle all routing errors, including 404s:

```js
const router = new UniversalRouter(
  [
    { path: '/', action: () => ({ content: 'Home' }) },
    { path: '/about', action: () => ({ content: 'About' }) },
  ],
  {
    errorHandler(error, context) {
      if (error.status === 404) {
        return {
          content: `<h1>Page Not Found</h1><p>The page "${context.pathname}" does not exist.</p>`,
          status: 404,
        }
      }
      // Re-throw other errors
      throw error
    },
  },
)

const result = await router.resolve('/nonexistent')
// => { content: '<h1>Page Not Found</h1>...', status: 404 }
```

### TypeScript errorHandler

```ts
import UniversalRouter, { RouteError, ResolveContext } from 'universal-router'

interface PageResult {
  content: string
  status?: number
}

const router = new UniversalRouter<PageResult>(routes, {
  errorHandler(error: RouteError, context: ResolveContext): PageResult {
    if (error.status === 404) {
      return {
        content: renderNotFoundPage(context.pathname),
        status: 404,
      }
    }
    return {
      content: renderErrorPage(error),
      status: error.status || 500,
    }
  },
})
```

## Catch-All Route Pattern

Add a wildcard route at the end of your routes to catch unmatched paths:

```js
const router = new UniversalRouter([
  { path: '/', action: () => ({ content: 'Home' }) },
  { path: '/about', action: () => ({ content: 'About' }) },
  { path: '/users/:id', action: (ctx, p) => ({ content: `User ${p.id}` }) },

  // Catch-all route - must be last!
  {
    path: '/*path',
    action: (context, params) => ({
      content: `<h1>404 Not Found</h1><p>Path: /${params.path.join('/')}</p>`,
      status: 404,
    }),
  },
])
```

### Nested Catch-All Routes

For nested route structures, add catch-all routes at each level:

```js
const router = new UniversalRouter({
  path: '',
  children: [
    { path: '/', action: () => ({ content: 'Home' }) },
    {
      path: '/admin',
      children: [
        { path: '', action: () => ({ content: 'Admin Home' }) },
        { path: '/users', action: () => ({ content: 'User Management' }) },
        // Catch-all for /admin/*
        {
          path: '/*rest',
          action: () => ({
            content: '<h1>Admin Page Not Found</h1>',
            status: 404,
          }),
        },
      ],
    },
    // Global catch-all
    {
      path: '/*path',
      action: () => ({
        content: '<h1>Page Not Found</h1>',
        status: 404,
      }),
    },
  ],
})
```

## Server-Side Status Codes

When rendering on the server, set the HTTP status code based on the route result:

### Node.js HTTP Server

```js
import http from 'http'
import UniversalRouter from 'universal-router'

const router = new UniversalRouter(routes, {
  errorHandler(error, context) {
    return {
      content: `<h1>${error.status === 404 ? 'Not Found' : 'Error'}</h1>`,
      status: error.status || 500,
    }
  },
})

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const result = await router.resolve(url.pathname)

  // Set status code from result
  res.statusCode = result.status || 200

  res.setHeader('Content-Type', 'text/html')
  res.end(`<!DOCTYPE html><html><body>${result.content}</body></html>`)
})

server.listen(3000)
```

### Express

```js
import express from 'express'
import UniversalRouter from 'universal-router'

const app = express()
const router = new UniversalRouter(routes, {
  errorHandler(error, context) {
    return {
      content: renderErrorPage(error),
      status: error.status || 500,
    }
  },
})

app.use(async (req, res) => {
  const result = await router.resolve(req.path)

  res.status(result.status || 200)
  res.send(result.content)
})

app.listen(3000)
```

## Custom 404 Pages

### Static 404 Page

```js
const notFoundPage = `
  <div class="not-found">
    <h1>404</h1>
    <h2>Page Not Found</h2>
    <p>Sorry, the page you're looking for doesn't exist.</p>
    <a href="/">Go Home</a>
  </div>
`

const router = new UniversalRouter(routes, {
  errorHandler(error, context) {
    if (error.status === 404) {
      return { content: notFoundPage, status: 404 }
    }
    throw error
  },
})
```

### Dynamic 404 with Suggestions

```js
import UniversalRouter from 'universal-router'

// Simple fuzzy matching for suggestions
function findSimilarPaths(pathname, routes, maxSuggestions = 3) {
  const suggestions = []

  function collectPaths(route, prefix = '') {
    const fullPath = prefix + (route.path || '')
    if (route.action && !fullPath.includes(':') && !fullPath.includes('*')) {
      suggestions.push(fullPath)
    }
    if (route.children) {
      route.children.forEach((child) => collectPaths(child, fullPath))
    }
  }

  routes.forEach((route) => collectPaths(route))

  // Simple similarity scoring
  return suggestions
    .map((path) => ({
      path,
      score: calculateSimilarity(pathname, path),
    }))
    .filter((s) => s.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions)
    .map((s) => s.path)
}

function calculateSimilarity(a, b) {
  const aSegments = a.split('/').filter(Boolean)
  const bSegments = b.split('/').filter(Boolean)
  let matches = 0
  aSegments.forEach((seg, i) => {
    if (bSegments[i] === seg) matches++
  })
  return matches / Math.max(aSegments.length, bSegments.length)
}

const routes = [
  { path: '/', action: () => ({ content: 'Home' }) },
  { path: '/about', action: () => ({ content: 'About' }) },
  { path: '/contact', action: () => ({ content: 'Contact' }) },
  { path: '/blog', action: () => ({ content: 'Blog' }) },
  { path: '/blog/:slug', action: () => ({ content: 'Post' }) },
]

const router = new UniversalRouter(routes, {
  errorHandler(error, context) {
    if (error.status === 404) {
      const suggestions = findSimilarPaths(context.pathname, routes)

      let suggestionsHtml = ''
      if (suggestions.length > 0) {
        suggestionsHtml = `
          <p>Did you mean:</p>
          <ul>
            ${suggestions.map((path) => `<li><a href="${path}">${path}</a></li>`).join('')}
          </ul>
        `
      }

      return {
        content: `
          <h1>Page Not Found</h1>
          <p>The page "${context.pathname}" doesn't exist.</p>
          ${suggestionsHtml}
          <p><a href="/">Go to homepage</a></p>
        `,
        status: 404,
      }
    }
    throw error
  },
})
```

## Handling Different Error Types

The errorHandler receives all errors, not just 404s. Handle different cases appropriately:

```js
const router = new UniversalRouter(routes, {
  errorHandler(error, context) {
    console.error('Route error:', error.message, 'Path:', context.pathname)

    switch (error.status) {
      case 404:
        return {
          content: render404Page(context),
          status: 404,
        }

      case 403:
        return {
          content: render403Page(context),
          status: 403,
        }

      case 500:
      default:
        // Log server errors
        console.error('Server error:', error.stack)
        return {
          content: render500Page(error),
          status: error.status || 500,
        }
    }
  },
})
```

### Custom Error Status in Routes

Throw custom errors from route actions:

```js
const router = new UniversalRouter([
  {
    path: '/admin',
    action: (context) => {
      if (!context.user) {
        const error = new Error('Authentication required')
        error.status = 401
        throw error
      }
      if (context.user.role !== 'admin') {
        const error = new Error('Admin access required')
        error.status = 403
        throw error
      }
      return { content: 'Admin Dashboard' }
    },
  },
])
```

## Async 404 Handling

Handle 404s that require async operations (e.g., checking database):

```js
const router = new UniversalRouter([
  {
    path: '/users/:username',
    async action(context, params) {
      const user = await db.findUser(params.username)
      if (!user) {
        // Return null to continue to next route
        return null
      }
      return { content: renderUserProfile(user) }
    },
  },
  {
    path: '/users/:username',
    action: (context, params) => ({
      content: `<h1>User Not Found</h1><p>No user named "${params.username}"</p>`,
      status: 404,
    }),
  },
])
```

Or use errorHandler with async:

```js
const router = new UniversalRouter(routes, {
  async errorHandler(error, context) {
    if (error.status === 404) {
      // Log 404s for analysis
      await analytics.log404(context.pathname)

      return {
        content: render404Page(context),
        status: 404,
      }
    }
    throw error
  },
})
```

## React Component Example

```jsx
import UniversalRouter from 'universal-router'

const NotFoundPage = ({ pathname, suggestions }) => (
  <div className="not-found-page">
    <h1>404</h1>
    <h2>Page Not Found</h2>
    <p>
      The page <code>{pathname}</code> could not be found.
    </p>
    {suggestions.length > 0 && (
      <>
        <p>You might be looking for:</p>
        <ul>
          {suggestions.map((path) => (
            <li key={path}>
              <a href={path}>{path}</a>
            </li>
          ))}
        </ul>
      </>
    )}
    <a href="/" className="home-link">
      Return Home
    </a>
  </div>
)

const router = new UniversalRouter(routes, {
  errorHandler(error, context) {
    if (error.status === 404) {
      const suggestions = findSimilarPaths(context.pathname, routes)
      return {
        component: NotFoundPage,
        props: { pathname: context.pathname, suggestions },
        status: 404,
      }
    }
    throw error
  },
})

// Usage
async function render(pathname) {
  const result = await router.resolve(pathname)
  const Component = result.component
  return <Component {...result.props} />
}
```

## Complete Example: Full Error Handling

```ts
import UniversalRouter, { RouteError, ResolveContext } from 'universal-router'

interface AppResult {
  content: string
  status: number
  title: string
}

interface AppContext extends ResolveContext {
  user?: { id: string; role: string }
}

const routes = [
  {
    path: '/',
    action: (): AppResult => ({
      content: '<h1>Home</h1>',
      status: 200,
      title: 'Home',
    }),
  },
  {
    path: '/dashboard',
    action: (context: AppContext): AppResult => {
      if (!context.user) {
        const error = new Error('Please log in') as RouteError
        error.status = 401
        throw error
      }
      return {
        content: '<h1>Dashboard</h1>',
        status: 200,
        title: 'Dashboard',
      }
    },
  },
  {
    path: '/admin',
    action: (context: AppContext): AppResult => {
      if (!context.user) {
        const error = new Error('Please log in') as RouteError
        error.status = 401
        throw error
      }
      if (context.user.role !== 'admin') {
        const error = new Error('Admin access required') as RouteError
        error.status = 403
        throw error
      }
      return {
        content: '<h1>Admin Panel</h1>',
        status: 200,
        title: 'Admin',
      }
    },
  },
]

function createErrorPage(
  status: number,
  title: string,
  message: string,
): AppResult {
  return {
    content: `
      <div class="error-page">
        <h1>${status}</h1>
        <h2>${title}</h2>
        <p>${message}</p>
        <a href="/">Go Home</a>
      </div>
    `,
    status,
    title,
  }
}

const router = new UniversalRouter<AppResult, AppContext>(routes, {
  errorHandler(error: RouteError, context: ResolveContext): AppResult {
    switch (error.status) {
      case 401:
        return createErrorPage(
          401,
          'Unauthorized',
          'Please log in to access this page.',
        )

      case 403:
        return createErrorPage(
          403,
          'Forbidden',
          'You do not have permission to access this page.',
        )

      case 404:
        return createErrorPage(
          404,
          'Not Found',
          `The page "${context.pathname}" does not exist.`,
        )

      default:
        console.error('Unexpected error:', error)
        return createErrorPage(
          500,
          'Server Error',
          'Something went wrong. Please try again later.',
        )
    }
  },
})

// Server usage
async function handleRequest(
  pathname: string,
  user?: { id: string; role: string },
) {
  const result = await router.resolve({ pathname, user })

  return {
    statusCode: result.status,
    body: `
      <!DOCTYPE html>
      <html>
        <head><title>${result.title}</title></head>
        <body>${result.content}</body>
      </html>
    `,
  }
}
```

## Common Pitfalls

### 1. Catch-All Route Not Last

The catch-all route must be the last route to avoid catching valid paths:

```js
// Wrong - catch-all before specific routes
const routes = [
  { path: '/*path', action: () => '404' },
  { path: '/about', action: () => 'About' }, // Never reached!
]

// Correct
const routes = [
  { path: '/about', action: () => 'About' },
  { path: '/*path', action: () => '404' }, // Last
]
```

### 2. Forgetting to Re-throw Non-404 Errors

```js
// Wrong - swallows all errors
errorHandler(error, context) {
  return { content: 'Error', status: error.status }
}

// Correct - only handle expected errors
errorHandler(error, context) {
  if (error.status === 404) {
    return { content: 'Not Found', status: 404 }
  }
  throw error // Re-throw unexpected errors
}
```

### 3. Not Setting HTTP Status Code

Always include the status code in your result for proper HTTP responses:

```js
// Wrong - status lost
return { content: 'Not Found' }

// Correct
return { content: 'Not Found', status: 404 }
```

## See Also

- [Route Matching Order and Priorities](./route-priorities.md) - Understanding route order
- [Authorization and Protected Routes](./authorization.md) - Handling 401/403 errors
- [Isomorphic Routing](./isomorphic-routing.md) - Server-side status codes
- [Universal Router API](./api.md) - Complete API reference
