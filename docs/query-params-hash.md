# URL Parameters, Query Strings, and Hash Fragments

Universal Router focuses on matching URL pathnames using path-to-regexp patterns. Query strings and
hash fragments are not part of the pathname and must be handled separately. This design keeps the
router simple while giving you full control over how to parse and use these URL components.

## Understanding URL Structure

A complete URL consists of several parts:

```
https://example.com/users/123?sort=name&order=asc#profile
                    └─────┬─────┘└────────┬────────┘└──┬───┘
                       pathname      query string    hash
```

Universal Router only matches the **pathname** portion. You pass query strings and hash fragments
through the context for use in route actions.

## Path Parameters

Path parameters are segments of the URL pathname that capture dynamic values. Define them using
the `:paramName` syntax.

### Type-Safe Parameters with defineRoute (Recommended)

Use `defineRoute` for automatic type inference in TypeScript:

```ts
import UniversalRouter, { defineRoute } from 'universal-router'

// Parameters are automatically typed from the path string
const userRoute = defineRoute({
  path: '/users/:userId',
  action: (context, params) => {
    // params.userId is typed as string - no manual annotation needed
    return { user: params.userId }
  },
})

const postRoute = defineRoute({
  path: '/posts/:year/:month/:slug',
  action: (context, params) => {
    // All three parameters are typed as string
    return {
      year: params.year,
      month: params.month,
      slug: params.slug,
    }
  },
})

const router = new UniversalRouter([userRoute, postRoute])

await router.resolve('/users/123')
// => { user: '123' }

await router.resolve('/posts/2025/01/hello-world')
// => { year: '2025', month: '01', slug: 'hello-world' }
```

### Basic Named Parameters (JavaScript)

For JavaScript projects without TypeScript:

```js
import UniversalRouter from 'universal-router'

const router = new UniversalRouter([
  {
    path: '/users/:userId',
    action: (context, params) => {
      // params.userId contains the captured value
      return { user: params.userId }
    },
  },
  {
    path: '/posts/:year/:month/:slug',
    action: (context, params) => {
      // Multiple parameters
      return {
        year: params.year,
        month: params.month,
        slug: params.slug,
      }
    },
  },
])

await router.resolve('/users/123')
// => { user: '123' }

await router.resolve('/posts/2025/01/hello-world')
// => { year: '2025', month: '01', slug: 'hello-world' }
```

```ts
import type { ExtractParams } from 'universal-router'

type UserParams = ExtractParams<'/users/:userId'>
// { userId: string }

type PostParams = ExtractParams<'/posts/:year/:month/:slug'>
// { year: string; month: string; slug: string }
```

## Wildcard Parameters

Wildcards capture multiple path segments, useful for file paths or catch-all routes.
Use the `*paramName` syntax.

```js
const router = new UniversalRouter([
  {
    path: '/files/*filepath',
    action: (context, params) => {
      // filepath is an array of path segments
      return { segments: params.filepath }
    },
  },
  {
    path: '/docs/*rest',
    action: (context, params) => {
      const fullPath = params.rest.join('/')
      return { documentPath: fullPath }
    },
  },
])

await router.resolve('/files/images/photos/vacation.jpg')
// => { segments: ['images', 'photos', 'vacation.jpg'] }

await router.resolve('/docs/api/reference/methods')
// => { documentPath: 'api/reference/methods' }
```

### TypeScript Wildcard Types

Wildcard parameters are typed as `string[]`:

```ts
import type { ExtractParams } from 'universal-router'

type FileParams = ExtractParams<'/files/*filepath'>
// { filepath: string[] }
```

## Query String Parsing

Universal Router does not parse query strings automatically. This is intentional - it allows you
to choose your preferred parsing library and strategy.

### Using URLSearchParams (Browser/Node.js)

```js
import UniversalRouter from 'universal-router'

const router = new UniversalRouter([
  {
    path: '/search',
    action: (context) => {
      const { query } = context
      return {
        term: query.q,
        page: parseInt(query.page, 10) || 1,
        filters: query.filters,
      }
    },
  },
])

// Parse query string before resolving
function resolve(url) {
  const urlObj = new URL(url, 'http://localhost')
  const query = Object.fromEntries(urlObj.searchParams)

  return router.resolve({
    pathname: urlObj.pathname,
    query, // Pass as context
  })
}

await resolve('/search?q=router&page=2')
// => { term: 'router', page: 2, filters: undefined }
```

### Handling Complex Query Parameters

For nested objects and arrays, use a library like [qs](https://github.com/ljharb/qs):

```js
import UniversalRouter from 'universal-router'
import qs from 'qs'

const router = new UniversalRouter([
  {
    path: '/products',
    action: (context) => {
      const { query } = context
      return {
        filters: query.filters,
        sort: query.sort,
      }
    },
  },
])

function resolve(url) {
  const [pathname, queryString] = url.split('?')
  const query = qs.parse(queryString || '')

  return router.resolve({ pathname, query })
}

// Complex query: /products?filters[color]=red&filters[size][]=M&filters[size][]=L
await resolve(
  '/products?filters[color]=red&filters[size][]=M&filters[size][]=L',
)
// => { filters: { color: 'red', size: ['M', 'L'] }, sort: undefined }
```

### Server-Side Query Parsing

On the server, query strings are typically parsed by your framework:

```js
import http from 'http'
import { URL } from 'url'
import UniversalRouter from 'universal-router'

const router = new UniversalRouter(routes)

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const query = Object.fromEntries(url.searchParams)

  const result = await router.resolve({
    pathname: url.pathname,
    query,
    // Include other useful context
    method: req.method,
    headers: req.headers,
  })

  res.end(JSON.stringify(result))
})
```

With Express:

```js
import express from 'express'
import UniversalRouter from 'universal-router'

const app = express()
const router = new UniversalRouter(routes)

app.use(async (req, res) => {
  const result = await router.resolve({
    pathname: req.path,
    query: req.query, // Express parses query automatically
    method: req.method,
  })

  res.json(result)
})
```

## Hash Fragments

Hash fragments (everything after `#`) are handled entirely by the browser and are never sent to
the server. Use them for:

- In-page navigation (scroll to anchors)
- Client-side state (though query strings are often preferred)
- Single-page application routing (hash-based routing)

### Scroll to Anchor

Handle hash-based scrolling in your navigation code:

```js
import UniversalRouter from 'universal-router'

const router = new UniversalRouter(routes)

async function navigate(url) {
  const urlObj = new URL(url, window.location.origin)

  // Resolve the route
  const result = await router.resolve({
    pathname: urlObj.pathname,
    query: Object.fromEntries(urlObj.searchParams),
    hash: urlObj.hash,
  })

  // Render the page
  renderPage(result)

  // Handle hash scrolling after render
  if (urlObj.hash) {
    // Wait for next frame to ensure DOM is updated
    requestAnimationFrame(() => {
      const element = document.querySelector(urlObj.hash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    })
  } else {
    // Scroll to top for new pages
    window.scrollTo(0, 0)
  }
}
```

### Hash in Route Actions

Pass the hash through context for use in actions:

```js
const router = new UniversalRouter([
  {
    path: '/docs/:section',
    action: (context, params) => {
      return {
        section: params.section,
        anchor: context.hash, // e.g., '#installation'
      }
    },
  },
])

// When resolving
const url = new URL('/docs/api#methods', window.location.origin)
await router.resolve({
  pathname: url.pathname,
  hash: url.hash,
})
// => { section: 'api', anchor: '#methods' }
```

### Hash-Based Routing (Legacy)

For applications that need to support older browsers without History API:

```js
import UniversalRouter from 'universal-router'

const router = new UniversalRouter([
  { path: '/', action: () => 'Home' },
  { path: '/about', action: () => 'About' },
])

// Listen for hash changes
window.addEventListener('hashchange', () => {
  const pathname = window.location.hash.slice(1) || '/'
  render(pathname)
})

async function render(pathname) {
  const result = await router.resolve(pathname)
  document.getElementById('app').innerHTML = result
}

// Navigate using hash
function navigate(path) {
  window.location.hash = path
}

// URLs will look like: example.com/#/about
navigate('/about')
```

## Generating URLs with Query Strings

Use the `generateUrls` add-on with `stringifyQueryParams` option:

```js
import UniversalRouter from 'universal-router'
import generateUrls from 'universal-router/generate-urls'

const routes = [
  { name: 'search', path: '/search' },
  { name: 'user', path: '/users/:userId' },
]

const router = new UniversalRouter(routes)
const url = generateUrls(router, {
  stringifyQueryParams: (params) => new URLSearchParams(params).toString(),
})

// Generate URLs with query strings
url('search', { q: 'router', page: '2' })
// => '/search?q=router&page=2'

// Path params are used for the path, extras become query string
url('user', { userId: '123', tab: 'settings' })
// => '/users/123?tab=settings'
```

For complex query strings, use a library:

```js
import qs from 'qs'

const url = generateUrls(router, {
  stringifyQueryParams: (params) =>
    qs.stringify(params, { arrayFormat: 'brackets' }),
})

url('search', { filters: { color: 'red', sizes: ['M', 'L'] } })
// => '/search?filters[color]=red&filters[sizes][]=M&filters[sizes][]=L'
```

## Complete Example: Search Page

```ts
import UniversalRouter from 'universal-router'
import generateUrls from 'universal-router/generate-urls'

interface SearchQuery {
  q?: string
  page?: string
  sort?: string
  filters?: Record<string, string | string[]>
}

interface SearchContext {
  pathname: string
  query: SearchQuery
}

const routes = [
  {
    name: 'search',
    path: '/search',
    action: (context: SearchContext) => {
      const { query } = context
      return {
        term: query.q || '',
        page: parseInt(query.page || '1', 10),
        sort: query.sort || 'relevance',
        filters: query.filters || {},
      }
    },
  },
]

const router = new UniversalRouter(routes)
const url = generateUrls(router, {
  stringifyQueryParams: (params) =>
    new URLSearchParams(params as Record<string, string>).toString(),
})

// Resolve a search URL
async function handleSearch(urlString: string) {
  const urlObj = new URL(urlString, 'http://localhost')
  const query: SearchQuery = Object.fromEntries(urlObj.searchParams)

  return router.resolve({
    pathname: urlObj.pathname,
    query,
  })
}

await handleSearch('/search?q=universal+router&page=2&sort=date')
// => { term: 'universal router', page: 2, sort: 'date', filters: {} }

// Generate a search URL
url('search', { q: 'router', page: '1' })
// => '/search?q=router&page=1'
```

## Common Pitfalls

### 1. Including Query String in pathname

The router only matches the pathname. Passing a full URL will fail:

```js
// Wrong - query string is part of pathname
await router.resolve('/search?q=test')
// May not match /search route!

// Correct - parse URL first
const url = new URL('/search?q=test', 'http://localhost')
await router.resolve({
  pathname: url.pathname, // '/search'
  query: Object.fromEntries(url.searchParams),
})
```

### 2. Forgetting to Decode Parameters

Path parameters are automatically decoded, but query strings may need manual handling:

```js
// Path params are decoded
await router.resolve('/users/John%20Doe')
// params.userId === 'John Doe' (decoded)

// Query strings from URLSearchParams are also decoded
const params = new URLSearchParams('name=John%20Doe')
params.get('name') // 'John Doe'
```

### 3. Hash Not Available on Server

The hash fragment is never sent to the server. Handle it client-side only:

```js
// Server-side: hash is not available
// req.url === '/docs/api' (no hash)

// Client-side: extract hash from window.location
const hash = window.location.hash // '#methods'
```

### 4. Empty Query Parameters

Handle empty or missing query parameters gracefully:

```js
{
  path: '/search',
  action: (context) => {
    const q = context.query?.q || ''
    const page = parseInt(context.query?.page, 10) || 1

    if (!q) {
      return { error: 'Search term required' }
    }

    return { term: q, page }
  }
}
```

## See Also

- [Single Page Application Navigation](./spa-navigation.md) - Full SPA routing setup
- [URL Generation](./api.md#url-generation) - Generating URLs with parameters
- [Isomorphic Routing](./isomorphic-routing.md) - Server and client routing
- [Universal Router API](./api.md) - Complete API reference
