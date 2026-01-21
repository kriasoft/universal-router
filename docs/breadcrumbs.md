# Building Navigation Breadcrumbs

Breadcrumbs provide users with a trail of links showing their current location within the
site hierarchy. Universal Router's nested route structure and parent references make it
easy to build dynamic breadcrumbs that update automatically as users navigate.

## Understanding Route Hierarchy

Universal Router automatically maintains parent-child relationships in routes. Each matched
route has a `parent` property that references its parent route, allowing you to traverse
the hierarchy.

```js
// Route structure
{
  path: '/products',
  name: 'products',
  title: 'Products',
  children: [
    {
      path: '/:category',
      name: 'category',
      title: 'Category',
      children: [
        {
          path: '/:productId',
          name: 'product',
          title: 'Product Details',
        },
      ],
    },
  ],
}

// When matching /products/electronics/phone-123:
// route.parent -> category route
// route.parent.parent -> products route
// route.parent.parent.parent -> root route
```

## Basic Breadcrumb Collection

Collect breadcrumbs by traversing the route hierarchy from the matched route to the root:

```js
import UniversalRouter from 'universal-router'

const routes = {
  path: '',
  title: 'Home',
  children: [
    {
      path: '/products',
      title: 'Products',
      children: [
        {
          path: '',
          title: 'All Products',
          action: () => ({ page: 'product-list' }),
        },
        {
          path: '/:category',
          title: 'Category',
          children: [
            {
              path: '',
              action: (ctx, params) => ({
                page: 'category',
                category: params.category,
              }),
            },
            {
              path: '/:productId',
              title: 'Product',
              action: (ctx, params) => ({
                page: 'product',
                category: params.category,
                productId: params.productId,
              }),
            },
          ],
        },
      ],
    },
  ],
}

function collectBreadcrumbs(route, params) {
  const breadcrumbs = []
  let current = route

  while (current) {
    if (current.title) {
      breadcrumbs.unshift({
        title: current.title,
        path: current.path,
      })
    }
    current = current.parent
  }

  return breadcrumbs
}

const router = new UniversalRouter(routes)

router.resolve('/products/electronics/phone-123').then((result) => {
  // result.page === 'product'
})
```

## Middleware Pattern for Breadcrumbs

Use middleware to automatically collect breadcrumbs and include them in route results:

```js
import UniversalRouter from 'universal-router'
import generateUrls from 'universal-router/generate-urls'

const routes = {
  path: '',
  name: 'home',
  title: 'Home',
  async action(context) {
    const result = await context.next()
    if (!result) return null

    // Collect breadcrumbs from route hierarchy
    const breadcrumbs = []
    let route = context.route

    while (route) {
      if (route.title && route.name) {
        breadcrumbs.unshift({
          title:
            typeof route.title === 'function'
              ? route.title(context.params)
              : route.title,
          name: route.name,
          path: route.path,
        })
      }
      route = route.parent
    }

    return {
      ...result,
      breadcrumbs,
    }
  },
  children: [
    {
      path: '',
      name: 'home-index',
      action: () => ({ content: 'Home Page' }),
    },
    {
      path: '/blog',
      name: 'blog',
      title: 'Blog',
      children: [
        {
          path: '',
          name: 'blog-index',
          action: () => ({ content: 'Blog Index' }),
        },
        {
          path: '/:slug',
          name: 'blog-post',
          title: (params) => `Post: ${params.slug}`,
          action: (ctx, params) => ({ content: `Blog Post: ${params.slug}` }),
        },
      ],
    },
  ],
}

const router = new UniversalRouter(routes)

const result = await router.resolve('/blog/hello-world')
console.log(result.breadcrumbs)
// [
//   { title: 'Home', name: 'home', path: '' },
//   { title: 'Blog', name: 'blog', path: '/blog' },
//   { title: 'Post: hello-world', name: 'blog-post', path: '/:slug' },
// ]
```

## Dynamic Breadcrumb Titles

Breadcrumb titles often need to be dynamic, showing actual names instead of IDs. Fetch
data and populate titles:

```js
const routes = {
  path: '',
  title: 'Home',
  async action(context) {
    const result = await context.next()
    if (!result) return null

    // Build breadcrumbs with resolved titles
    const breadcrumbs = await buildBreadcrumbs(context)

    return { ...result, breadcrumbs }
  },
  children: [
    {
      path: '/users',
      title: 'Users',
      children: [
        {
          path: '/:userId',
          // Dynamic title - will be resolved
          title: async (params) => {
            const user = await fetchUser(params.userId)
            return user.name
          },
          action: async (ctx, params) => {
            const user = await fetchUser(params.userId)
            return { content: user, type: 'user-profile' }
          },
        },
      ],
    },
  ],
}

async function buildBreadcrumbs(context) {
  const breadcrumbs = []
  let route = context.route

  while (route) {
    if (route.title) {
      const title =
        typeof route.title === 'function'
          ? await route.title(context.params)
          : route.title

      breadcrumbs.unshift({ title, path: route.path })
    }
    route = route.parent
  }

  return breadcrumbs
}
```

### Caching Dynamic Titles

Avoid duplicate fetches by caching data in context:

```js
const routes = {
  path: '/users/:userId',
  title: (params, context) => context.userData?.name || 'User',
  async action(context, params) {
    // Fetch once and store in context
    const userData = await fetchUser(params.userId)
    context.userData = userData

    return {
      content: userData,
      breadcrumbs: await buildBreadcrumbs(context),
    }
  },
}
```

## Generating Breadcrumb URLs

Use `generateUrls` to create proper links for each breadcrumb:

```js
import UniversalRouter from 'universal-router'
import generateUrls from 'universal-router/generate-urls'

const routes = [
  {
    path: '',
    name: 'root',
    title: 'Home',
    children: [
      {
        path: '/categories',
        name: 'categories',
        title: 'Categories',
        children: [
          {
            path: '/:categoryId',
            name: 'category',
            title: (params) => `Category ${params.categoryId}`,
            children: [
              {
                path: '/products/:productId',
                name: 'product',
                title: (params) => `Product ${params.productId}`,
                action: (ctx, params) => ({ params }),
              },
            ],
          },
        ],
      },
    ],
  },
]

const router = new UniversalRouter(routes)
const url = generateUrls(router)

async function resolveBreadcrumbs(pathname) {
  const result = await router.resolve(pathname)
  const breadcrumbs = []
  let route = result.route
  const params = result.params

  while (route) {
    if (route.name && route.title) {
      breadcrumbs.unshift({
        title:
          typeof route.title === 'function' ? route.title(params) : route.title,
        url: route.name === 'root' ? '/' : url(route.name, params),
      })
    }
    route = route.parent
  }

  return breadcrumbs
}

const breadcrumbs = await resolveBreadcrumbs(
  '/categories/electronics/products/phone-1',
)
// [
//   { title: 'Home', url: '/' },
//   { title: 'Categories', url: '/categories' },
//   { title: 'Category electronics', url: '/categories/electronics' },
//   { title: 'Product phone-1', url: '/categories/electronics/products/phone-1' },
// ]
```

## Rendering Breadcrumbs

### HTML Rendering

```js
function renderBreadcrumbs(breadcrumbs) {
  const items = breadcrumbs.map((crumb, index) => {
    const isLast = index === breadcrumbs.length - 1

    if (isLast) {
      return `<span class="breadcrumb-current">${crumb.title}</span>`
    }

    return `<a href="${crumb.url}" class="breadcrumb-link">${crumb.title}</a>`
  })

  return `
    <nav aria-label="Breadcrumb" class="breadcrumbs">
      ${items.join('<span class="breadcrumb-separator">/</span>')}
    </nav>
  `
}
```

### React Component

```jsx
function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol>
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={crumb.url || index}>
              {isLast ? (
                <span aria-current="page">{crumb.title}</span>
              ) : (
                <>
                  <a href={crumb.url}>{crumb.title}</a>
                  <span aria-hidden="true">/</span>
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
```

## SEO Structured Data

Add JSON-LD structured data for search engines to display breadcrumbs in search results:

```js
function generateBreadcrumbSchema(breadcrumbs, baseUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.title,
      item: `${baseUrl}${crumb.url}`,
    })),
  }
}

function renderPageWithBreadcrumbs(result, baseUrl) {
  const schema = generateBreadcrumbSchema(result.breadcrumbs, baseUrl)

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <script type="application/ld+json">
          ${JSON.stringify(schema)}
        </script>
      </head>
      <body>
        ${renderBreadcrumbs(result.breadcrumbs)}
        ${result.content}
      </body>
    </html>
  `
}

// Generated schema for /categories/electronics/products/phone-1:
// {
//   "@context": "https://schema.org",
//   "@type": "BreadcrumbList",
//   "itemListElement": [
//     { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com/" },
//     { "@type": "ListItem", "position": 2, "name": "Categories", "item": "https://example.com/categories" },
//     { "@type": "ListItem", "position": 3, "name": "Electronics", "item": "https://example.com/categories/electronics" },
//     { "@type": "ListItem", "position": 4, "name": "Phone 1", "item": "https://example.com/categories/electronics/products/phone-1" }
//   ]
// }
```

## Complete Example

```ts
import UniversalRouter, { Route, RouteContext } from 'universal-router'
import generateUrls from 'universal-router/generate-urls'

interface Breadcrumb {
  title: string
  url: string
}

interface PageResult {
  content: string
  breadcrumbs: Breadcrumb[]
}

interface AppRoute extends Route<PageResult> {
  title?:
    | string
    | ((params: Record<string, string>) => string | Promise<string>)
}

const routes: AppRoute = {
  path: '',
  name: 'root',
  title: 'Home',
  async action(context) {
    const result = await context.next()
    if (!result) return null

    const breadcrumbs = await collectBreadcrumbs(context, url)
    return { ...result, breadcrumbs }
  },
  children: [
    {
      path: '',
      name: 'home',
      action: () => ({ content: '<h1>Welcome</h1>', breadcrumbs: [] }),
    },
    {
      path: '/shop',
      name: 'shop',
      title: 'Shop',
      children: [
        {
          path: '',
          name: 'shop-index',
          action: () => ({ content: '<h1>Shop</h1>', breadcrumbs: [] }),
        },
        {
          path: '/:category',
          name: 'shop-category',
          title: (params) => capitalizeFirst(params.category),
          children: [
            {
              path: '',
              name: 'category-index',
              action: (ctx, params) => ({
                content: `<h1>${params.category}</h1>`,
                breadcrumbs: [],
              }),
            },
            {
              path: '/:productId',
              name: 'product',
              title: async (params) => {
                const product = await fetchProduct(params.productId)
                return product.name
              },
              action: async (ctx, params) => {
                const product = await fetchProduct(params.productId)
                return {
                  content: `<h1>${product.name}</h1><p>${product.description}</p>`,
                  breadcrumbs: [],
                }
              },
            },
          ],
        },
      ],
    },
  ],
}

const router = new UniversalRouter(routes)
const url = generateUrls(router)

async function collectBreadcrumbs(
  context: RouteContext,
  urlGenerator: ReturnType<typeof generateUrls>,
): Promise<Breadcrumb[]> {
  const breadcrumbs: Breadcrumb[] = []
  let route = context.route as AppRoute | null

  while (route) {
    if (route.title && route.name) {
      const title =
        typeof route.title === 'function'
          ? await route.title(context.params as Record<string, string>)
          : route.title

      const routeUrl =
        route.name === 'root' ? '/' : urlGenerator(route.name, context.params)

      breadcrumbs.unshift({ title, url: routeUrl })
    }
    route = route.parent as AppRoute | null
  }

  return breadcrumbs
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

async function fetchProduct(id: string) {
  // Simulated fetch
  return { name: `Product ${id}`, description: 'A great product' }
}

// Usage
const result = await router.resolve('/shop/electronics/laptop-pro')
console.log(result.breadcrumbs)
// [
//   { title: 'Home', url: '/' },
//   { title: 'Shop', url: '/shop' },
//   { title: 'Electronics', url: '/shop/electronics' },
//   { title: 'Product laptop-pro', url: '/shop/electronics/laptop-pro' },
// ]
```

## Common Pitfalls

### 1. Missing Route Names

Without route names, URL generation will fail:

```js
// Wrong - no name for URL generation
{
  path: '/products',
  title: 'Products',
  // Missing name!
}

// Correct
{
  path: '/products',
  name: 'products',
  title: 'Products',
}
```

### 2. Inconsistent Parameter Names

Breadcrumb URL generation needs all parameters from the hierarchy:

```js
// Wrong - parent uses 'id', child uses different 'id'
{
  path: '/:id',
  children: [{ path: '/items/:id' }] // Overwrites parent 'id'
}

// Correct - unique names
{
  path: '/:categoryId',
  children: [{ path: '/items/:itemId' }]
}
```

### 3. Forgetting to Handle Root Route

The root route often needs special handling in URL generation:

```js
// Handle root route specially
const routeUrl = route.name === 'root' ? '/' : url(route.name, params)
```

## See Also

- [Nested Routes and Layouts](./nested-routes.md) - Understanding route hierarchy
- [URL Generation](./api.md#url-generation) - Generating URLs from route names
- [Route Matching Order](./route-priorities.md) - How routes are matched
- [Universal Router API](./api.md) - Complete API reference
