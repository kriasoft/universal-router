# Controlling Scroll Behavior

When building single-page applications (SPAs), managing scroll position is essential for
a good user experience. Users expect the page to scroll to the top when navigating to
a new page, return to their previous position when going back, and jump to anchors
when clicking hash links.

Universal Router doesn't manage scroll behavior directly - it focuses on URL matching
and route resolution. This guide shows how to implement scroll management alongside
your router.

## Common Scroll Behaviors

There are several scroll behaviors users expect:

| Navigation Type        | Expected Behavior                |
| ---------------------- | -------------------------------- |
| New page (link click)  | Scroll to top                    |
| Back/forward button    | Restore previous scroll position |
| Hash link (`#section`) | Scroll to element with that ID   |
| Same-page navigation   | Maintain current position        |
| Route with state       | Use custom position from state   |

## Basic Scroll to Top

The simplest implementation scrolls to the top on every navigation:

```ts
import UniversalRouter from 'universal-router'

const router = new UniversalRouter(routes)

async function navigate(pathname: string) {
  const result = await router.resolve(pathname)
  render(result)

  // Scroll to top after rendering
  window.scrollTo(0, 0)
}

// Handle link clicks
document.addEventListener('click', (event) => {
  const link = (event.target as Element).closest('a')
  if (link && link.hostname === window.location.hostname) {
    event.preventDefault()
    history.pushState(null, '', link.href)
    navigate(link.pathname)
  }
})
```

## Scroll Position Restoration

Preserve and restore scroll positions for browser back/forward navigation:

```ts
import UniversalRouter from 'universal-router'

const router = new UniversalRouter(routes)

// Store scroll positions by history state key
const scrollPositions = new Map<string, { x: number; y: number }>()

// Generate unique key for each history entry
function getHistoryKey(): string {
  return history.state?.key || 'initial'
}

// Save current scroll position before navigating away
function saveScrollPosition() {
  const key = getHistoryKey()
  scrollPositions.set(key, {
    x: window.scrollX,
    y: window.scrollY,
  })
}

// Restore scroll position for current history entry
function restoreScrollPosition() {
  const key = getHistoryKey()
  const position = scrollPositions.get(key)

  if (position) {
    window.scrollTo(position.x, position.y)
  } else {
    window.scrollTo(0, 0)
  }
}

async function navigate(pathname: string, options?: { replace?: boolean }) {
  const result = await router.resolve(pathname)
  render(result)

  // Use requestAnimationFrame to ensure DOM has updated
  requestAnimationFrame(() => {
    restoreScrollPosition()
  })
}

// Handle link clicks - new navigation
document.addEventListener('click', (event) => {
  const link = (event.target as Element).closest('a')
  if (link && link.hostname === window.location.hostname) {
    event.preventDefault()

    // Save current position before navigating
    saveScrollPosition()

    // Create new history entry with unique key
    const key = Date.now().toString()
    history.pushState({ key }, '', link.href)

    navigate(link.pathname)
  }
})

// Handle back/forward - restore position
window.addEventListener('popstate', () => {
  navigate(window.location.pathname)
})
```

## Hash Anchor Support

Handle hash links that scroll to elements on the page:

```ts
import UniversalRouter from 'universal-router'

const router = new UniversalRouter(routes)

interface NavigateOptions {
  replace?: boolean
  hash?: string
  scroll?: boolean
}

async function navigate(pathname: string, options: NavigateOptions = {}) {
  const result = await router.resolve(pathname)
  render(result)

  // Handle scrolling after render
  requestAnimationFrame(() => {
    const hash = options.hash || window.location.hash

    if (hash) {
      // Scroll to element with matching ID
      scrollToHash(hash)
    } else if (options.scroll !== false) {
      // Default: scroll to top for new pages
      window.scrollTo(0, 0)
    }
  })
}

function scrollToHash(hash: string) {
  // Remove the leading #
  const id = hash.slice(1)
  if (!id) return

  // Find element by ID or name attribute
  const element =
    document.getElementById(id) || document.querySelector(`[name="${id}"]`)

  if (element) {
    element.scrollIntoView()
    // Optionally set focus for accessibility
    if (element.tabIndex === -1) {
      element.tabIndex = -1
    }
    element.focus({ preventScroll: true })
  }
}

// Handle link clicks
document.addEventListener('click', (event) => {
  const link = (event.target as Element).closest('a')
  if (!link || link.hostname !== window.location.hostname) return

  event.preventDefault()

  const url = new URL(link.href)
  const isSamePage = url.pathname === window.location.pathname

  if (isSamePage && url.hash) {
    // Same page, just scroll to anchor
    history.pushState(null, '', url.hash)
    scrollToHash(url.hash)
  } else {
    // Different page
    history.pushState(null, '', link.href)
    navigate(url.pathname, { hash: url.hash })
  }
})
```

## Smooth Scrolling

Add smooth scrolling for a polished feel:

```ts
interface ScrollOptions {
  behavior?: ScrollBehavior
  offset?: number
}

function scrollToTop(options: ScrollOptions = {}) {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: options.behavior || 'smooth',
  })
}

function scrollToElement(element: Element, options: ScrollOptions = {}) {
  const rect = element.getBoundingClientRect()
  const offset = options.offset || 0

  window.scrollTo({
    top: window.scrollY + rect.top - offset,
    left: 0,
    behavior: options.behavior || 'smooth',
  })
}

function scrollToHash(hash: string, options: ScrollOptions = {}) {
  const id = hash.slice(1)
  const element = document.getElementById(id)

  if (element) {
    scrollToElement(element, options)
  }
}

// Usage
async function navigate(pathname: string) {
  const result = await router.resolve(pathname)
  render(result)

  requestAnimationFrame(() => {
    const hash = window.location.hash
    if (hash) {
      // Account for fixed header (e.g., 64px)
      scrollToHash(hash, { offset: 64, behavior: 'smooth' })
    } else {
      scrollToTop({ behavior: 'smooth' })
    }
  })
}
```

## Instant vs Smooth Scrolling

Use instant scrolling for back/forward, smooth for new navigation:

```ts
type NavigationType = 'push' | 'pop' | 'replace'

async function navigate(pathname: string, type: NavigationType = 'push') {
  const result = await router.resolve(pathname)
  render(result)

  requestAnimationFrame(() => {
    const hash = window.location.hash
    // Use instant scroll for back/forward, smooth for new navigation
    const behavior = type === 'pop' ? 'instant' : 'smooth'

    if (hash) {
      scrollToHash(hash, { behavior })
    } else if (type === 'pop') {
      restoreScrollPosition()
    } else {
      scrollToTop({ behavior })
    }
  })
}

// Back/forward
window.addEventListener('popstate', () => {
  navigate(window.location.pathname, 'pop')
})

// Link clicks
document.addEventListener('click', (event) => {
  const link = (event.target as Element).closest('a')
  if (link && link.hostname === window.location.hostname) {
    event.preventDefault()
    saveScrollPosition()
    history.pushState({ key: Date.now().toString() }, '', link.href)
    navigate(new URL(link.href).pathname, 'push')
  }
})
```

## Preserving Scroll on Filter/Sort Changes

When updating filters (like in issue #104), preserve scroll position:

```ts
async function updateFilters(filters: Record<string, string>) {
  // Build new URL with filter params
  const params = new URLSearchParams(filters)
  const newPath = `${window.location.pathname}?${params}`

  // Use replaceState to not add history entry
  history.replaceState(history.state, '', newPath)

  // Resolve with the new query params
  const result = await router.resolve({
    pathname: window.location.pathname,
    query: filters,
  })

  render(result)

  // Don't scroll - preserve current position
}

// Example usage in a filter component
function FilterCheckbox({ name, value, checked, onChange }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => {
        const newFilters = { ...currentFilters }
        if (e.target.checked) {
          newFilters[name] = value
        } else {
          delete newFilters[name]
        }
        updateFilters(newFilters)
      }}
    />
  )
}
```

## Complete Scroll Manager

Here's a full-featured scroll manager you can use:

```ts
interface ScrollManagerOptions {
  /** Offset from top for fixed headers */
  offset?: number
  /** Default scroll behavior */
  behavior?: ScrollBehavior
  /** Custom scroll container (defaults to window) */
  container?: Element | null
}

class ScrollManager {
  private positions = new Map<string, { x: number; y: number }>()
  private options: Required<ScrollManagerOptions>

  constructor(options: ScrollManagerOptions = {}) {
    this.options = {
      offset: options.offset || 0,
      behavior: options.behavior || 'smooth',
      container: options.container || null,
    }
  }

  /** Save current scroll position */
  save(key: string = this.getKey()) {
    if (this.options.container) {
      this.positions.set(key, {
        x: this.options.container.scrollLeft,
        y: this.options.container.scrollTop,
      })
    } else {
      this.positions.set(key, {
        x: window.scrollX,
        y: window.scrollY,
      })
    }
  }

  /** Restore saved scroll position */
  restore(key: string = this.getKey(), behavior?: ScrollBehavior) {
    const position = this.positions.get(key)
    if (position) {
      this.scrollTo(position.x, position.y, behavior || 'instant')
      return true
    }
    return false
  }

  /** Scroll to top */
  toTop(behavior?: ScrollBehavior) {
    this.scrollTo(0, 0, behavior || this.options.behavior)
  }

  /** Scroll to element by ID */
  toElement(id: string, behavior?: ScrollBehavior) {
    const element = document.getElementById(id)
    if (element) {
      this.toElementNode(element, behavior)
    }
  }

  /** Scroll to element node */
  toElementNode(element: Element, behavior?: ScrollBehavior) {
    const rect = element.getBoundingClientRect()
    const currentScroll = this.options.container
      ? this.options.container.scrollTop
      : window.scrollY

    this.scrollTo(
      0,
      currentScroll + rect.top - this.options.offset,
      behavior || this.options.behavior,
    )
  }

  /** Scroll to hash (including #) */
  toHash(hash: string, behavior?: ScrollBehavior) {
    if (hash.startsWith('#')) {
      this.toElement(hash.slice(1), behavior)
    }
  }

  /** Get current history key */
  private getKey(): string {
    return history.state?.key || 'initial'
  }

  /** Perform the scroll */
  private scrollTo(x: number, y: number, behavior: ScrollBehavior) {
    const options: ScrollToOptions = { left: x, top: y, behavior }

    if (this.options.container) {
      this.options.container.scrollTo(options)
    } else {
      window.scrollTo(options)
    }
  }
}

// Usage
const scrollManager = new ScrollManager({ offset: 64 })

async function navigate(
  pathname: string,
  type: 'push' | 'pop' | 'replace' = 'push',
) {
  // Save before navigating (for push/replace)
  if (type !== 'pop') {
    scrollManager.save()
  }

  const result = await router.resolve(pathname)
  render(result)

  requestAnimationFrame(() => {
    const hash = window.location.hash

    if (hash) {
      scrollManager.toHash(hash, type === 'pop' ? 'instant' : 'smooth')
    } else if (type === 'pop') {
      scrollManager.restore()
    } else {
      scrollManager.toTop()
    }
  })
}
```

## React Integration

Create a hook for scroll management in React:

```tsx
import { useEffect, useRef, useCallback } from 'react'

interface UseScrollRestorationOptions {
  offset?: number
}

export function useScrollRestoration(
  options: UseScrollRestorationOptions = {},
) {
  const positions = useRef(new Map<string, number>())
  const { offset = 0 } = options

  const getKey = useCallback(() => {
    return history.state?.key || window.location.pathname
  }, [])

  const save = useCallback(() => {
    positions.current.set(getKey(), window.scrollY)
  }, [getKey])

  const restore = useCallback(() => {
    const y = positions.current.get(getKey())
    if (y !== undefined) {
      window.scrollTo({ top: y, behavior: 'instant' })
      return true
    }
    return false
  }, [getKey])

  const scrollToTop = useCallback((smooth = true) => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'instant',
    })
  }, [])

  const scrollToHash = useCallback(
    (hash: string, smooth = true) => {
      const element = document.getElementById(hash.replace('#', ''))
      if (element) {
        const y = element.getBoundingClientRect().top + window.scrollY - offset
        window.scrollTo({
          top: y,
          behavior: smooth ? 'smooth' : 'instant',
        })
      }
    },
    [offset],
  )

  return { save, restore, scrollToTop, scrollToHash }
}

// Usage in a navigation component
function AppRouter() {
  const [content, setContent] = useState<React.ReactNode>(null)
  const { save, restore, scrollToTop, scrollToHash } = useScrollRestoration({
    offset: 64,
  })
  const navigationTypeRef = useRef<'push' | 'pop'>('push')

  useEffect(() => {
    async function handleNavigation() {
      const result = await router.resolve(window.location.pathname)
      setContent(result)

      requestAnimationFrame(() => {
        const hash = window.location.hash
        const isPop = navigationTypeRef.current === 'pop'

        if (hash) {
          scrollToHash(hash, !isPop)
        } else if (isPop) {
          restore()
        } else {
          scrollToTop()
        }

        navigationTypeRef.current = 'push'
      })
    }

    handleNavigation()

    const handlePopState = () => {
      navigationTypeRef.current = 'pop'
      handleNavigation()
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [restore, scrollToTop, scrollToHash])

  const navigate = useCallback(
    (href: string) => {
      save()
      history.pushState({ key: Date.now().toString() }, '', href)
      // Trigger navigation
      window.dispatchEvent(new PopStateEvent('popstate'))
    },
    [save],
  )

  return (
    <NavigationContext.Provider value={{ navigate }}>
      {content}
    </NavigationContext.Provider>
  )
}
```

## CSS scroll-behavior

You can also use CSS for smooth scrolling, but it affects all scrolling:

```css
/* Global smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Respect user preference for reduced motion */
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

Then in JavaScript, just use regular `scrollTo`:

```ts
// CSS handles the smooth animation
window.scrollTo(0, 0)
```

## Common Pitfalls

### 1. Scrolling Before Render Completes

Don't scroll immediately - wait for the DOM to update:

```ts
// Wrong - DOM might not be ready
const result = await router.resolve(pathname)
render(result)
window.scrollTo(0, 0) // Might scroll before content renders

// Correct - wait for next frame
const result = await router.resolve(pathname)
render(result)
requestAnimationFrame(() => {
  window.scrollTo(0, 0)
})
```

### 2. Hash Elements Not Found

Elements might not exist yet when scrolling to hash:

```ts
// Wrong - element might not exist
function navigate(pathname) {
  render(result)
  scrollToHash(window.location.hash)
}

// Correct - wait for render, with retry
function navigate(pathname) {
  render(result)

  requestAnimationFrame(() => {
    const hash = window.location.hash
    if (!hash) return

    const element = document.getElementById(hash.slice(1))
    if (element) {
      element.scrollIntoView()
    } else {
      // Retry after async content loads
      setTimeout(() => {
        const el = document.getElementById(hash.slice(1))
        el?.scrollIntoView()
      }, 100)
    }
  })
}
```

### 3. Losing Position on Re-renders

Component re-renders can disrupt scroll position:

```tsx
// Wrong - loses scroll position on every state change
function Page() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchData().then(setData)
  }, [])

  if (!data) return <Loading /> // Different height!

  return <Content data={data} />
}

// Better - maintain layout during loading
function Page() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchData().then(setData)
  }, [])

  return (
    <div style={{ minHeight: '100vh' }}>
      {data ? <Content data={data} /> : <ContentSkeleton />}
    </div>
  )
}
```

### 4. Fixed Headers Covering Content

Account for fixed headers when scrolling to elements:

```ts
// Wrong - element hidden under fixed header
element.scrollIntoView()

// Correct - account for header height
const headerHeight = 64
const y = element.getBoundingClientRect().top + window.scrollY - headerHeight
window.scrollTo({ top: y, behavior: 'smooth' })
```

## See Also

- [SPA Navigation](./spa-navigation.md) - Client-side routing basics
- [Query Params and Hash](./query-params-hash.md) - Working with URL fragments
- [Page Transitions](./page-transitions.md) - Animated route transitions
