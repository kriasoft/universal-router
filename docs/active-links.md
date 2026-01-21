# Highlighting Active Links

Active link highlighting helps users understand where they are in your application.
This guide shows how to track the current route and style navigation links to
indicate the active page.

## The Challenge

Universal Router resolves routes but doesn't provide built-in link components or
active state tracking. You need to:

1. Track the current pathname
2. Compare it against link destinations
3. Apply appropriate styling

## Basic Implementation

### Tracking Current Route

Create a simple state manager for the current route:

```ts
// route-state.ts
type Listener = (pathname: string) => void

let currentPathname = window.location.pathname
const listeners = new Set<Listener>()

export function getCurrentPathname() {
  return currentPathname
}

export function setCurrentPathname(pathname: string) {
  currentPathname = pathname
  listeners.forEach((listener) => listener(pathname))
}

export function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
```

### Checking Active State

Function to check if a link is active, with trailing slash normalization:

```ts
// Normalize paths to handle trailing slash inconsistencies
function normalizePath(path: string): string {
  return path.replace(/\/+$/, '') || '/'
}

function isActive(href: string, currentPath: string, exact = false): boolean {
  const normalizedHref = normalizePath(href)
  const normalizedPath = normalizePath(currentPath)

  if (exact) {
    return normalizedHref === normalizedPath
  }
  // Partial match - href is prefix of current path
  return (
    normalizedPath === normalizedHref ||
    normalizedPath.startsWith(normalizedHref + '/')
  )
}

// Usage
isActive('/', '/users', true) // false (exact match)
isActive('/', '/users', false) // false (/ is not prefix of /users)
isActive('/users', '/users/123', false) // true (partial match)
isActive('/users', '/users/123', true) // false (exact match)
isActive('/users/', '/users', false) // true (trailing slash normalized)
isActive('/users', '/users/', true) // true (trailing slash normalized)
```

> **Why normalize?** URLs like `/users` and `/users/` are often treated as equivalent,
> but string comparison would consider them different. Normalizing ensures consistent
> behavior regardless of trailing slash presence.

## Vanilla JavaScript Implementation

### Navigation Component

```ts
import { getCurrentPathname, subscribe } from './route-state'

interface NavLink {
  href: string
  label: string
  exact?: boolean
}

function createNavigation(links: NavLink[], container: HTMLElement) {
  function render() {
    const currentPath = getCurrentPathname()

    container.innerHTML = links
      .map((link) => {
        const active = isActive(link.href, currentPath, link.exact)
        return `
          <a
            href="${link.href}"
            class="nav-link ${active ? 'active' : ''}"
            ${active ? 'aria-current="page"' : ''}
          >
            ${link.label}
          </a>
        `
      })
      .join('')
  }

  // Initial render
  render()

  // Re-render on route changes
  subscribe(render)
}

// Usage
const nav = document.getElementById('nav')!
createNavigation(
  [
    { href: '/', label: 'Home', exact: true },
    { href: '/about', label: 'About' },
    { href: '/users', label: 'Users' },
    { href: '/settings', label: 'Settings' },
  ],
  nav,
)
```

### CSS Styling

```css
.nav-link {
  padding: 8px 16px;
  text-decoration: none;
  color: #333;
  border-radius: 4px;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.nav-link:hover {
  background-color: #f0f0f0;
}

.nav-link.active {
  background-color: #007bff;
  color: white;
}

/* Alternative: underline style */
.nav-link-underline {
  padding: 8px 16px;
  text-decoration: none;
  color: #333;
  position: relative;
}

.nav-link-underline.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #007bff;
}
```

## React Implementation

### NavLink Component

Create a reusable NavLink component:

```tsx
import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
} from 'react'

// Context for current route
interface RouterContextValue {
  pathname: string
  navigate: (href: string) => void
}

const RouterContext = createContext<RouterContextValue>({
  pathname: '/',
  navigate: () => {},
})

export function useRouter() {
  return useContext(RouterContext)
}

// NavLink component
interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  exact?: boolean
  activeClassName?: string
  activeStyle?: React.CSSProperties
  children: React.ReactNode
}

export function NavLink({
  href,
  exact = false,
  activeClassName = 'active',
  activeStyle,
  className = '',
  style,
  children,
  ...props
}: NavLinkProps) {
  const { pathname, navigate } = useRouter()
  const isLinkActive = isActive(href, pathname, exact)

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    navigate(href)
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`${className} ${isLinkActive ? activeClassName : ''}`}
      style={isLinkActive ? { ...style, ...activeStyle } : style}
      aria-current={isLinkActive ? 'page' : undefined}
      {...props}
    >
      {children}
    </a>
  )
}

// Normalize paths to handle trailing slash inconsistencies
function normalizePath(path: string): string {
  return path.replace(/\/+$/, '') || '/'
}

function isActive(href: string, currentPath: string, exact: boolean): boolean {
  const normalizedHref = normalizePath(href)
  const normalizedPath = normalizePath(currentPath)

  if (exact) {
    return normalizedHref === normalizedPath
  }
  return (
    normalizedPath === normalizedHref ||
    normalizedPath.startsWith(normalizedHref + '/')
  )
}
```

### Router Provider

```tsx
import UniversalRouter from 'universal-router'

interface RouterProviderProps {
  router: UniversalRouter
  children: React.ReactNode
}

export function RouterProvider({ router, children }: RouterProviderProps) {
  const [pathname, setPathname] = useState(window.location.pathname)
  const [content, setContent] = useState<React.ReactNode>(null)

  const navigate = useCallback(
    async (href: string) => {
      history.pushState(null, '', href)
      setPathname(href)
      const result = await router.resolve(href)
      setContent(result)
    },
    [router],
  )

  useEffect(() => {
    // Initial route resolution
    router.resolve(pathname).then(setContent)

    // Handle browser back/forward
    const handlePopState = () => {
      const newPath = window.location.pathname
      setPathname(newPath)
      router.resolve(newPath).then(setContent)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [router, pathname])

  return (
    <RouterContext.Provider value={{ pathname, navigate }}>
      {children}
      {content}
    </RouterContext.Provider>
  )
}
```

### Usage

```tsx
import { NavLink, RouterProvider } from './router'
import UniversalRouter from 'universal-router'

const routes = [
  { path: '/', action: () => <HomePage /> },
  { path: '/about', action: () => <AboutPage /> },
  { path: '/users', action: () => <UsersPage /> },
  { path: '/users/:id', action: (ctx, params) => <UserPage id={params.id} /> },
]

const router = new UniversalRouter(routes)

function Navigation() {
  return (
    <nav>
      <NavLink href="/" exact>
        Home
      </NavLink>
      <NavLink href="/about">About</NavLink>
      <NavLink href="/users">Users</NavLink>
    </nav>
  )
}

function App() {
  return (
    <RouterProvider router={router}>
      <Navigation />
    </RouterProvider>
  )
}
```

## Advanced Matching

### Partial vs Exact Matching

Different links need different matching strategies:

```tsx
<nav>
  {/* Exact match - only active on "/" */}
  <NavLink href="/" exact>
    Home
  </NavLink>

  {/* Partial match - active on "/users" and "/users/123" */}
  <NavLink href="/users">Users</NavLink>

  {/* Exact match - only active on "/users" not "/users/123" */}
  <NavLink href="/users" exact>
    Users List
  </NavLink>
</nav>
```

### Matching with Query Parameters

Include or ignore query parameters in matching:

```tsx
function isActiveWithQuery(
  href: string,
  currentPath: string,
  currentSearch: string,
  options: { exact?: boolean; ignoreQuery?: boolean } = {},
): boolean {
  const url = new URL(href, window.location.origin)
  const pathMatches = options.exact
    ? url.pathname === currentPath
    : currentPath.startsWith(url.pathname)

  if (!pathMatches) return false

  if (options.ignoreQuery || !url.search) {
    return true
  }

  // Check if query params match
  return url.search === currentSearch
}

// Usage
function NavLink({ href, exact, matchQuery, ...props }) {
  const { pathname } = useRouter()
  const search = window.location.search

  const isLinkActive = isActiveWithQuery(href, pathname, search, {
    exact,
    ignoreQuery: !matchQuery,
  })

  // ...
}

// Links
<NavLink href="/search?q=react" matchQuery>React Search</NavLink>
<NavLink href="/search">All Searches</NavLink>
```

### Active Parent Routes

Highlight parent routes when children are active:

```tsx
const routes = [
  {
    path: '/settings',
    name: 'settings',
    children: [
      { path: '', name: 'settings-general', action: () => <GeneralSettings /> },
      {
        path: '/profile',
        name: 'settings-profile',
        action: () => <ProfileSettings />,
      },
      {
        path: '/security',
        name: 'settings-security',
        action: () => <SecuritySettings />,
      },
    ],
  },
]

// Navigation with nested active states
function SettingsNav() {
  const { pathname } = useRouter()

  return (
    <nav>
      {/* Parent is active when any child is active */}
      <NavLink href="/settings">Settings</NavLink>

      {/* Nested navigation */}
      <div className="nested-nav">
        <NavLink href="/settings" exact>
          General
        </NavLink>
        <NavLink href="/settings/profile">Profile</NavLink>
        <NavLink href="/settings/security">Security</NavLink>
      </div>
    </nav>
  )
}
```

## Render Props Pattern

For more control, use render props:

```tsx
interface NavLinkRenderProps {
  isActive: boolean
  isExactActive: boolean
}

interface NavLinkWithRenderProps {
  href: string
  children: (props: NavLinkRenderProps) => React.ReactNode
}

function NavLink({ href, children }: NavLinkWithRenderProps) {
  const { pathname, navigate } = useRouter()

  const isLinkActive = pathname.startsWith(href)
  const isExactActive = pathname === href

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault()
    navigate(href)
  }

  return (
    <a href={href} onClick={handleClick}>
      {children({ isActive: isLinkActive, isExactActive })}
    </a>
  )
}

// Usage with custom rendering
;<NavLink href="/users">
  {({ isActive, isExactActive }) => (
    <span
      className={isActive ? 'text-blue-500' : 'text-gray-500'}
      style={{ fontWeight: isExactActive ? 'bold' : 'normal' }}
    >
      Users
      {isActive && <span className="indicator" />}
    </span>
  )}
</NavLink>
```

## Multiple Navigation Areas

Handle different navigation areas (header, sidebar, breadcrumbs):

```tsx
// Shared hook for active state
function useIsActive(href: string, exact = false): boolean {
  const { pathname } = useRouter()
  return exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + '/')
}

// Header navigation
function HeaderNav() {
  return (
    <nav className="header-nav">
      <NavLink href="/" exact className="header-link">
        Home
      </NavLink>
      <NavLink href="/products" className="header-link">
        Products
      </NavLink>
    </nav>
  )
}

// Sidebar navigation with icons
function SidebarNav() {
  const links = [
    { href: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
    { href: '/users', icon: UsersIcon, label: 'Users' },
    { href: '/settings', icon: SettingsIcon, label: 'Settings' },
  ]

  return (
    <nav className="sidebar-nav">
      {links.map((link) => (
        <NavLink
          key={link.href}
          href={link.href}
          className="sidebar-link"
          activeClassName="sidebar-link-active"
        >
          <link.icon className="sidebar-icon" />
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

// Breadcrumb navigation
function Breadcrumbs() {
  const { pathname } = useRouter()
  const segments = pathname.split('/').filter(Boolean)

  return (
    <nav aria-label="Breadcrumb">
      <ol className="breadcrumbs">
        <li>
          <NavLink href="/" exact>
            Home
          </NavLink>
        </li>
        {segments.map((segment, index) => {
          const href = '/' + segments.slice(0, index + 1).join('/')
          const isLast = index === segments.length - 1

          return (
            <li key={href}>
              {isLast ? (
                <span aria-current="page">{segment}</span>
              ) : (
                <NavLink href={href}>{segment}</NavLink>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
```

## Accessibility

Ensure active links are accessible:

```tsx
function NavLink({ href, exact, children, ...props }: NavLinkProps) {
  const { pathname, navigate } = useRouter()
  const isLinkActive = isActive(href, pathname, exact)

  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault()
        navigate(href)
      }}
      // Indicate current page to screen readers
      aria-current={isLinkActive ? 'page' : undefined}
      // Don't rely solely on color for active state
      className={isLinkActive ? 'nav-link active' : 'nav-link'}
      {...props}
    >
      {children}
      {/* Visual indicator that doesn't rely on color */}
      {isLinkActive && <span className="sr-only">(current page)</span>}
    </a>
  )
}
```

```css
/* Accessible active styles */
.nav-link.active {
  /* Color change */
  color: #007bff;

  /* Plus visual indicator */
  font-weight: bold;
  border-bottom: 2px solid currentColor;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
```

## CSS-Only Active States (Limited)

If you control the page and can set classes on the body:

```ts
// Update body class on navigation
function navigate(pathname: string) {
  // Convert path to class name: /users/123 -> page-users
  const pageClass = 'page-' + pathname.split('/')[1] || 'home'

  // Remove old page classes
  document.body.className = document.body.className
    .split(' ')
    .filter((c) => !c.startsWith('page-'))
    .join(' ')

  // Add new page class
  document.body.classList.add(pageClass)

  // ... rest of navigation
}
```

```css
/* Style links based on body class */
body.page-home .nav-link[href='/'] {
  color: #007bff;
  font-weight: bold;
}

body.page-users .nav-link[href='/users'] {
  color: #007bff;
  font-weight: bold;
}

body.page-settings .nav-link[href='/settings'] {
  color: #007bff;
  font-weight: bold;
}
```

This approach is limited but requires no JavaScript in the nav component.

## Common Pitfalls

### 1. Home Link Always Active

The "/" path is a prefix of all paths:

```tsx
// Wrong - "/" matches everything
<NavLink href="/">Home</NavLink>  // Always active!

// Correct - use exact matching for home
<NavLink href="/" exact>Home</NavLink>
```

### 2. Trailing Slashes

The `isActive` function shown earlier in this guide already handles trailing slash
normalization. If you're using an older version without normalization:

```ts
// Without normalization - paths are treated as different!
'/users/' !== '/users' // true (different strings)

// With normalization (recommended) - consistent behavior
normalizePath('/users/') === normalizePath('/users') // true
```

Always normalize paths before comparison to avoid inconsistent behavior.

### 3. Not Updating on Navigation

Ensure navigation triggers re-renders:

```tsx
// Wrong - component doesn't re-render
function NavLink({ href, children }) {
  // pathname is captured once, never updates
  const pathname = window.location.pathname
  // ...
}

// Correct - subscribe to route changes
function NavLink({ href, children }) {
  const { pathname } = useRouter() // Updates on navigation
  // ...
}
```

### 4. Missing aria-current

Don't forget accessibility:

```tsx
// Wrong - no indication for screen readers
<a className={active ? 'active' : ''}>Link</a>

// Correct - includes aria-current
<a
  className={active ? 'active' : ''}
  aria-current={active ? 'page' : undefined}
>
  Link
</a>
```

## See Also

- [SPA Navigation](./spa-navigation.md) - Client-side routing basics
- [Breadcrumbs](./breadcrumbs.md) - Building breadcrumb navigation
- [Scroll Behavior](./scroll-behavior.md) - Managing scroll position
- [Page Transitions](./page-transitions.md) - Animated route changes
