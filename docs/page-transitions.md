# Page Transitions and Animations

Universal Router is a minimal, unopinionated routing library that does not include built-in animation
support. This design allows you to use any animation library or technique that fits your project.
This recipe shows how to implement smooth page transitions using CSS, React Transition Group,
and Framer Motion.

## Understanding the Challenge

Page transitions require coordination between routing and animation timing:

1. **Exit animation**: The outgoing page must animate out before removal
2. **Enter animation**: The incoming page must animate in after mounting
3. **Timing coordination**: The router must wait for exit animations to complete
4. **State management**: Both pages may need to exist simultaneously during transitions

Universal Router's action-based approach gives you full control over this process.

## CSS Transitions (Vanilla JavaScript)

For simple fade transitions without a framework, use CSS and manage element lifecycles manually:

```css
/* styles.css */
.page {
  opacity: 1;
  transition: opacity 300ms ease-in-out;
}

.page.fade-out {
  opacity: 0;
}

.page.fade-in {
  opacity: 0;
}
```

```js
import UniversalRouter from 'universal-router'

const routes = [
  { path: '/', action: () => '<div class="page"><h1>Home</h1></div>' },
  { path: '/about', action: () => '<div class="page"><h1>About</h1></div>' },
  {
    path: '/contact',
    action: () => '<div class="page"><h1>Contact</h1></div>',
  },
]

const router = new UniversalRouter(routes)
const container = document.getElementById('app')

async function renderWithTransition(pathname) {
  const newContent = await router.resolve(pathname)
  const currentPage = container.querySelector('.page')

  if (currentPage) {
    // Start exit animation
    currentPage.classList.add('fade-out')

    // Wait for animation to complete
    await new Promise((resolve) => {
      currentPage.addEventListener('transitionend', resolve, { once: true })
    })
  }

  // Insert new content
  container.innerHTML = newContent

  // Trigger enter animation
  const newPage = container.querySelector('.page')
  if (newPage) {
    newPage.classList.add('fade-in')
    // Force reflow to ensure animation triggers
    void newPage.offsetWidth
    newPage.classList.remove('fade-in')
  }
}

// Navigation handler
function navigate(pathname) {
  window.history.pushState(null, '', pathname)
  renderWithTransition(pathname)
}

// Initial render
renderWithTransition(window.location.pathname)

// Handle browser back/forward
window.addEventListener('popstate', () => {
  renderWithTransition(window.location.pathname)
})
```

## React Transition Group

React Transition Group provides components for managing enter/exit transitions. Use `CSSTransition`
or `SwitchTransition` for page-level animations.

### Basic Setup with CSSTransition

```tsx
import { useState, useEffect, useRef } from 'react'
import { CSSTransition, SwitchTransition } from 'react-transition-group'
import UniversalRouter from 'universal-router'

// Define routes that return React components
const routes = [
  { path: '/', action: () => ({ Component: HomePage, key: 'home' }) },
  { path: '/about', action: () => ({ Component: AboutPage, key: 'about' }) },
  {
    path: '/users/:id',
    action: (ctx) => ({
      Component: () => <UserPage userId={ctx.params.id} />,
      key: `user-${ctx.params.id}`,
    }),
  },
]

const router = new UniversalRouter(routes)

function App() {
  const [route, setRoute] = useState<{
    Component: React.FC
    key: string
  } | null>(null)
  const nodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function handleNavigation() {
      const result = await router.resolve(window.location.pathname)
      setRoute(result)
    }

    handleNavigation()

    const handlePopState = () => handleNavigation()
    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (!route) return <div>Loading...</div>

  const { Component, key } = route

  return (
    <SwitchTransition mode="out-in">
      <CSSTransition
        key={key}
        nodeRef={nodeRef}
        timeout={300}
        classNames="page"
        unmountOnExit
      >
        <div ref={nodeRef} className="page-container">
          <Component />
        </div>
      </CSSTransition>
    </SwitchTransition>
  )
}
```

```css
/* Page transition styles */
.page-container {
  width: 100%;
}

/* Enter transition */
.page-enter {
  opacity: 0;
  transform: translateX(20px);
}

.page-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition:
    opacity 300ms ease-out,
    transform 300ms ease-out;
}

/* Exit transition */
.page-exit {
  opacity: 1;
  transform: translateX(0);
}

.page-exit-active {
  opacity: 0;
  transform: translateX(-20px);
  transition:
    opacity 300ms ease-in,
    transform 300ms ease-in;
}
```

### Handling Same-Route Parameter Changes

When navigating between `/user/123` and `/user/456`, you want transitions even though the route
structure is the same. The key to this is using a unique key that includes the parameters:

```tsx
const routes = [
  {
    path: '/users/:id',
    action: (context) => ({
      Component: UserPage,
      // Include params in the key to trigger transitions
      key: `user-${context.params.id}`,
      params: context.params,
    }),
  },
]

function App() {
  const [route, setRoute] = useState(null)
  const nodeRef = useRef(null)

  // ... navigation setup

  return (
    <SwitchTransition mode="out-in">
      <CSSTransition
        // key changes when params change, triggering transition
        key={route.key}
        nodeRef={nodeRef}
        timeout={300}
        classNames="page"
      >
        <div ref={nodeRef}>
          <route.Component {...route.params} />
        </div>
      </CSSTransition>
    </SwitchTransition>
  )
}
```

## Framer Motion

Framer Motion provides a more powerful and declarative API for animations with built-in
support for exit animations through `AnimatePresence`.

### Basic Framer Motion Setup

```tsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import UniversalRouter from 'universal-router'

const pageVariants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: -20,
  },
}

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
}

// Wrap each page component with motion
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  )
}

const routes = [
  {
    path: '/',
    action: () => ({
      element: (
        <PageWrapper>
          <HomePage />
        </PageWrapper>
      ),
      key: 'home',
    }),
  },
  {
    path: '/about',
    action: () => ({
      element: (
        <PageWrapper>
          <AboutPage />
        </PageWrapper>
      ),
      key: 'about',
    }),
  },
  {
    path: '/users/:id',
    action: (ctx) => ({
      element: (
        <PageWrapper>
          <UserPage userId={ctx.params.id} />
        </PageWrapper>
      ),
      key: `user-${ctx.params.id}`,
    }),
  },
]

const router = new UniversalRouter(routes)

function App() {
  const [route, setRoute] = useState<{
    element: JSX.Element
    key: string
  } | null>(null)

  useEffect(() => {
    async function navigate() {
      const result = await router.resolve(window.location.pathname)
      setRoute(result)
    }

    navigate()
    window.addEventListener('popstate', navigate)
    return () => window.removeEventListener('popstate', navigate)
  }, [])

  return (
    <div className="app">
      <AnimatePresence mode="wait">
        {route && <motion.div key={route.key}>{route.element}</motion.div>}
      </AnimatePresence>
    </div>
  )
}
```

### Direction-Aware Transitions

Create transitions that animate based on navigation direction (forward/backward):

```tsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import UniversalRouter from 'universal-router'

// Track navigation history for direction detection
const history: string[] = []

function getDirection(pathname: string): 'forward' | 'back' {
  const currentIndex = history.indexOf(pathname)
  if (currentIndex === -1) {
    history.push(pathname)
    return 'forward'
  }
  // Going back in history
  history.length = currentIndex + 1
  return 'back'
}

const variants = {
  enter: (direction: 'forward' | 'back') => ({
    x: direction === 'forward' ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: 'forward' | 'back') => ({
    x: direction === 'forward' ? '-100%' : '100%',
    opacity: 0,
  }),
}

function App() {
  const [route, setRoute] = useState(null)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')

  async function handleNavigation(pathname: string) {
    setDirection(getDirection(pathname))
    const result = await router.resolve(pathname)
    setRoute(result)
  }

  useEffect(() => {
    handleNavigation(window.location.pathname)
    window.addEventListener('popstate', () => {
      handleNavigation(window.location.pathname)
    })
  }, [])

  return (
    <AnimatePresence mode="wait" custom={direction}>
      {route && (
        <motion.div
          key={route.key}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'tween', duration: 0.3 }}
        >
          {route.element}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

## Implementing onLeave Logic

Universal Router does not have built-in lifecycle hooks like `onLeave`. However, you can implement
this pattern using wrapper functions or middleware:

### Using Action Wrappers

```ts
import UniversalRouter, { RouteContext } from 'universal-router'

interface RouteWithLifecycle {
  path: string
  onEnter?: (context: RouteContext) => void | Promise<void>
  onLeave?: (context: RouteContext) => void | Promise<void>
  action: (context: RouteContext) => any
}

// Track current route for onLeave calls
let currentRoute: RouteWithLifecycle | null = null
let currentContext: RouteContext | null = null

function createLifecycleRoutes(routes: RouteWithLifecycle[]) {
  return routes.map((route) => ({
    path: route.path,
    async action(context: RouteContext) {
      // Call onLeave for previous route
      if (currentRoute?.onLeave && currentContext) {
        await currentRoute.onLeave(currentContext)
      }

      // Call onEnter for new route
      if (route.onEnter) {
        await route.onEnter(context)
      }

      // Update current route
      currentRoute = route
      currentContext = context

      return route.action(context)
    },
  }))
}

const routes = createLifecycleRoutes([
  {
    path: '/editor',
    onEnter: () => console.log('Entering editor'),
    onLeave: async (context) => {
      // Prompt user to save changes
      if (hasUnsavedChanges()) {
        const confirmed = await showConfirmDialog('Save changes?')
        if (confirmed) {
          await saveChanges()
        }
      }
    },
    action: () => '<div id="editor">Editor Page</div>',
  },
  {
    path: '/home',
    action: () => '<div>Home Page</div>',
  },
])

const router = new UniversalRouter(routes)
```

### Using Navigation Guards

For more complex scenarios, implement navigation guards that can prevent navigation:

```ts
type NavigationGuard = (from: string, to: string) => boolean | Promise<boolean>

const guards: NavigationGuard[] = []

function addNavigationGuard(guard: NavigationGuard) {
  guards.push(guard)
  return () => {
    const index = guards.indexOf(guard)
    if (index > -1) guards.splice(index, 1)
  }
}

async function canNavigate(from: string, to: string): Promise<boolean> {
  for (const guard of guards) {
    const allowed = await guard(from, to)
    if (!allowed) return false
  }
  return true
}

// Usage
let currentPath = window.location.pathname

async function navigate(pathname: string) {
  const canProceed = await canNavigate(currentPath, pathname)
  if (!canProceed) {
    console.log('Navigation blocked')
    return
  }

  window.history.pushState(null, '', pathname)
  currentPath = pathname
  await render(pathname)
}

// Add a guard for unsaved changes
addNavigationGuard(async (from, to) => {
  if (from.startsWith('/editor') && hasUnsavedChanges()) {
    return window.confirm('You have unsaved changes. Leave anyway?')
  }
  return true
})
```

## Exit Animations with Async Actions

Routes can return promises to delay rendering until animations complete:

```tsx
const routes = [
  {
    path: '/gallery/:id',
    async action(context) {
      const imageId = context.params.id

      // Preload next image while exit animation plays
      const imagePromise = preloadImage(`/images/${imageId}.jpg`)

      // Return component with preloaded data
      const image = await imagePromise
      return {
        element: <GalleryImage src={image} />,
        key: `gallery-${imageId}`,
      }
    },
  },
]
```

## Shared Element Transitions (View Transitions API)

Modern browsers support the View Transitions API for native page transitions:

```ts
import UniversalRouter from 'universal-router'

const router = new UniversalRouter(routes)
const container = document.getElementById('app')

async function renderWithViewTransition(pathname: string) {
  const newContent = await router.resolve(pathname)

  // Check if View Transitions API is supported
  if (!document.startViewTransition) {
    container.innerHTML = newContent
    return
  }

  // Use View Transitions API
  const transition = document.startViewTransition(() => {
    container.innerHTML = newContent
  })

  await transition.finished
}

function navigate(pathname: string) {
  window.history.pushState(null, '', pathname)
  renderWithViewTransition(pathname)
}
```

```css
/* Customize the view transition */
::view-transition-old(root) {
  animation: 300ms ease-out fade-out;
}

::view-transition-new(root) {
  animation: 300ms ease-in fade-in;
}

@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Shared element transitions */
.hero-image {
  view-transition-name: hero;
}
```

## Performance Considerations

### Avoid Layout Thrashing

Use `transform` and `opacity` for animations instead of properties that trigger layout:

```css
/* Good - only composite properties */
.page-enter-active {
  transform: translateX(0);
  opacity: 1;
}

/* Avoid - triggers layout */
.page-enter-active {
  left: 0;
  width: 100%;
}
```

### Use will-change Sparingly

```css
.page-container {
  /* Only add when animation is about to start */
  will-change: transform, opacity;
}
```

### Reduce Motion for Accessibility

Respect user preferences for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-exit-active {
    transition: none;
  }
}
```

```tsx
// In React with Framer Motion
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
).matches

const pageTransition = prefersReducedMotion
  ? { duration: 0 }
  : { type: 'tween', duration: 0.3 }
```

## Common Pitfalls

### 1. Forgetting Unique Keys

Without unique keys, React cannot properly track which elements should animate:

```tsx
// Wrong - no key or non-unique key
<AnimatePresence>
  <motion.div>
    {route.element}
  </motion.div>
</AnimatePresence>

// Correct - unique key per route
<AnimatePresence>
  <motion.div key={route.key}>
    {route.element}
  </motion.div>
</AnimatePresence>
```

### 2. Exit Animation Not Playing

AnimatePresence requires the exiting component to remain mounted during exit:

```tsx
// Wrong - conditionally rendering outside AnimatePresence
{
  route && (
    <AnimatePresence>
      <motion.div key={route.key}>{route.element}</motion.div>
    </AnimatePresence>
  )
}

// Correct - condition inside AnimatePresence
;<AnimatePresence>
  {route && <motion.div key={route.key}>{route.element}</motion.div>}
</AnimatePresence>
```

### 3. Memory Leaks with Cleanup

Always clean up animation listeners and timeouts:

```ts
useEffect(() => {
  const controller = new AbortController()

  async function handleNavigation() {
    // Use AbortController to cancel pending animations
    const result = await router.resolve(pathname)
    if (!controller.signal.aborted) {
      setRoute(result)
    }
  }

  handleNavigation()

  return () => controller.abort()
}, [pathname])
```

## See Also

- [SPA Navigation](./spa-navigation.md) - Client-side navigation setup
- [Code Splitting](./code-splitting.md) - Lazy loading pages for better performance
- [React and Redux Integration](./react-redux.md) - State management with routing
- [Universal Router API](./api.md) - Complete API reference
