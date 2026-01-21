# Usage with React and Redux

Universal Router integrates naturally with Redux, enabling "Redux-first routing" where the
application's location state lives in the Redux store. This approach enables time-travel
debugging, easier testing, and centralized state management for navigation.

## Redux-First Routing Philosophy

In traditional routing, the browser URL is the source of truth and components read from it directly.
In Redux-first routing:

1. **URL changes** dispatch actions to Redux
2. **Redux store** holds the current location
3. **Components** read location from Redux store
4. **Router** resolves routes based on store state

This gives you:

- Time-travel debugging with Redux DevTools
- Ability to navigate by dispatching actions
- Serializable state for server-side rendering
- Easier testing (mock store instead of browser)

## Basic Setup with Redux Toolkit (Recommended)

Redux Toolkit is the modern, recommended way to use Redux. It reduces boilerplate
and provides better TypeScript support out of the box.

### 1. Router Slice

```ts
// store/router/slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface RouterState {
  pathname: string
  search: string
  hash: string
  query: Record<string, string>
}

function parseQuery(search: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(search))
}

const initialState: RouterState = {
  pathname: window.location.pathname,
  search: window.location.search,
  hash: window.location.hash,
  query: parseQuery(window.location.search),
}

const routerSlice = createSlice({
  name: 'router',
  initialState,
  reducers: {
    locationChanged(state, action: PayloadAction<Partial<RouterState>>) {
      const { pathname, search = '', hash = '' } = action.payload
      if (pathname) state.pathname = pathname
      state.search = search
      state.hash = hash
      state.query = parseQuery(search)
    },
  },
})

export const { locationChanged } = routerSlice.actions
export default routerSlice.reducer
```

### 2. Router Middleware

```ts
// store/router/middleware.ts
import type { Middleware } from '@reduxjs/toolkit'
import { locationChanged } from './slice'

export const routerMiddleware: Middleware = (store) => {
  // Sync browser navigation with Redux
  window.addEventListener('popstate', () => {
    store.dispatch(
      locationChanged({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      }),
    )
  })

  return (next) => (action) => next(action)
}

// Navigation helpers (call these from components)
export function push(pathname: string) {
  window.history.pushState(null, '', pathname)
  // Dispatch will be handled by the component
}

export function replace(pathname: string) {
  window.history.replaceState(null, '', pathname)
}
```

### 3. Configure Store

```ts
// store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import routerReducer from './router/slice'
import { routerMiddleware } from './router/middleware'

export const store = configureStore({
  reducer: {
    router: routerReducer,
    // ... other reducers
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(routerMiddleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

## Integrating Universal Router

### Route Resolution Based on Store State

```tsx
// router/index.tsx
import UniversalRouter from 'universal-router'
import type { ReactNode } from 'react'
import { store, RootState } from '../store'

const routes = [
  { path: '/', action: () => import('../pages/Home') },
  { path: '/users', action: () => import('../pages/Users') },
  { path: '/users/:id', action: () => import('../pages/User') },
]

const router = new UniversalRouter(routes, {
  context: {
    // Make store available in route actions
    store,
  },
})

// Resolve routes when store changes
let currentPathname = ''

export function subscribeToRouteChanges(
  onRoute: (component: ReactNode) => void,
) {
  return store.subscribe(async () => {
    const state = store.getState()
    const { pathname } = state.router

    // Skip if pathname hasn't changed
    if (pathname === currentPathname) return
    currentPathname = pathname

    try {
      const module = await router.resolve({
        pathname,
        // Pass Redux state to routes
        state,
      })
      onRoute(<module.default />)
    } catch (error: any) {
      if (error.status === 404) {
        onRoute(<NotFound />)
      }
    }
  })
}
```

### App Component

```tsx
// App.tsx
import { useState, useEffect } from 'react'
import { Provider } from 'react-redux'
import { store } from './store'
import { subscribeToRouteChanges } from './router'

function Router() {
  const [content, setContent] = useState<ReactNode>(null)

  useEffect(() => {
    const unsubscribe = subscribeToRouteChanges(setContent)
    return unsubscribe
  }, [])

  return <>{content}</>
}

export default function App() {
  return (
    <Provider store={store}>
      <Router />
    </Provider>
  )
}
```

## Navigation with Redux

### Using Hooks

```tsx
// hooks/useNavigation.ts
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { push, replace, goBack, goForward } from '../store/router/actions'

export function useNavigation() {
  const dispatch = useDispatch()

  return {
    navigate: useCallback(
      (pathname: string) => dispatch(push(pathname)),
      [dispatch],
    ),
    replace: useCallback(
      (pathname: string) => dispatch(replace(pathname)),
      [dispatch],
    ),
    goBack: useCallback(() => dispatch(goBack()), [dispatch]),
    goForward: useCallback(() => dispatch(goForward()), [dispatch]),
  }
}
```

### Navigation Components

```tsx
// components/Link.tsx
import { useCallback, MouseEvent, ReactNode } from 'react'
import { useDispatch } from 'react-redux'
import { push } from '../store/router/actions'

interface LinkProps {
  to: string
  children: ReactNode
  replace?: boolean
  className?: string
}

export function Link({
  to,
  children,
  replace: shouldReplace,
  className,
}: LinkProps) {
  const dispatch = useDispatch()

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      // Allow ctrl/cmd click for new tab
      if (event.metaKey || event.ctrlKey) return

      event.preventDefault()
      dispatch(shouldReplace ? replace(to) : push(to))
    },
    [dispatch, to, shouldReplace],
  )

  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
```

### Usage in Components

```tsx
// pages/UserList.tsx
import { useSelector } from 'react-redux'
import { Link } from '../components/Link'
import { useNavigation } from '../hooks/useNavigation'
import type { RootState } from '../store'

export default function UserList() {
  const { pathname, query } = useSelector((state: RootState) => state.router)
  const { navigate, goBack } = useNavigation()

  const handleUserClick = (userId: string) => {
    navigate(`/users/${userId}`)
  }

  return (
    <div>
      <h1>Users</h1>
      <p>Current path: {pathname}</p>
      <p>Search: {query.search || 'none'}</p>

      <button onClick={goBack}>Go Back</button>

      {/* Declarative navigation */}
      <Link to="/users/1">User 1</Link>
      <Link to="/users/2">User 2</Link>

      {/* Programmatic navigation */}
      <button onClick={() => handleUserClick('3')}>View User 3</button>
    </div>
  )
}
```

## Passing Route Params to Redux

Store route params in Redux for components that need them:

```ts
// store/router/types.ts
export interface RouterState {
  pathname: string
  search: string
  hash: string
  query: Record<string, string>
  params: Record<string, string> // Add params
}

// store/router/actions.ts
export const setRouteParams = (params: Record<string, string>) => ({
  type: 'router/SET_PARAMS' as const,
  payload: params,
})
```

```tsx
// router/index.tsx
const routes = [
  {
    path: '/users/:id',
    async action(context) {
      const { id } = context.params

      // Store params in Redux before rendering
      context.store.dispatch(setRouteParams({ id }))

      const { default: User } = await import('../pages/User')
      return <User />
    },
  },
]
```

```tsx
// pages/User.tsx
import { useSelector } from 'react-redux'
import type { RootState } from '../store'

export default function User() {
  // Get params from Redux, not from router directly
  const { id } = useSelector((state: RootState) => state.router.params)

  return <h1>User {id}</h1>
}
```

## Time-Travel Debugging

With Redux DevTools, you can:

- See navigation history as actions
- Jump to any previous location
- Replay navigation sequences

To make time-travel work correctly, the middleware needs to sync history:

```ts
// Enhanced middleware with time-travel support
export function createRouterMiddleware(): Middleware {
  return (store) => {
    let isTimeTraveling = false

    // Detect Redux DevTools time travel
    if (window.__REDUX_DEVTOOLS_EXTENSION__) {
      window.__REDUX_DEVTOOLS_EXTENSION__.subscribe((message) => {
        if (
          message.type === 'DISPATCH' &&
          message.payload.type === 'JUMP_TO_STATE'
        ) {
          isTimeTraveling = true
          const state = JSON.parse(message.state)
          // Update browser URL to match jumped-to state
          window.history.replaceState(null, '', state.router.pathname)
          isTimeTraveling = false
        }
      })
    }

    window.addEventListener('popstate', () => {
      if (!isTimeTraveling) {
        store.dispatch(
          locationChange({
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
          }),
        )
      }
    })

    // ... rest of middleware
  }
}
```

## Server-Side Rendering

For SSR, create the store with the initial location:

```tsx
// server.tsx
import { configureStore } from '@reduxjs/toolkit'
import { renderToString } from 'react-dom/server'
import { Provider } from 'react-redux'
import UniversalRouter from 'universal-router'
import routes from './routes'
import { routerReducer } from './store/router/reducer'

app.get('*', async (req, res) => {
  // Create store with current URL
  const store = configureStore({
    reducer: { router: routerReducer },
    preloadedState: {
      router: {
        pathname: req.path,
        search: req.search || '',
        hash: '',
        query: req.query,
        params: {},
      },
    },
  })

  const router = new UniversalRouter(routes, {
    context: { store },
  })

  const page = await router.resolve(req.path)

  const html = renderToString(<Provider store={store}>{page}</Provider>)

  res.send(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="root">${html}</div>
        <script>
          window.__PRELOADED_STATE__ = ${JSON.stringify(store.getState())};
        </script>
        <script src="/client.js"></script>
      </body>
    </html>
  `)
})
```

## Legacy: Verbose Action Constants

If you need explicit action type constants (for older codebases or specific tooling),
here's the traditional Redux approach:

```ts
// store/router/types.ts
export const LOCATION_CHANGE = 'router/LOCATION_CHANGE'
export const PUSH = 'router/PUSH'
export const REPLACE = 'router/REPLACE'

// store/router/actions.ts
export const locationChange = (payload: LocationChangePayload) => ({
  type: LOCATION_CHANGE as typeof LOCATION_CHANGE,
  payload,
})

export const push = (pathname: string) => ({
  type: PUSH as typeof PUSH,
  payload: { pathname },
})

export type RouterAction =
  | ReturnType<typeof locationChange>
  | ReturnType<typeof push>
// ... other actions

// store/router/reducer.ts
export function routerReducer(
  state = initialState,
  action: RouterAction,
): RouterState {
  switch (action.type) {
    case LOCATION_CHANGE:
      return { ...state, ...action.payload }
    default:
      return state
  }
}
```

> **Note**: Redux Toolkit's `createSlice` generates action types automatically and
> provides better TypeScript inference. Use the legacy approach only when required
> by existing infrastructure.

## Common Pitfalls

### 1. Stale Component Renders

When route params change, connected components may render with old params:

```tsx
// Problem: Component sees old params briefly
function User() {
  const params = useSelector((state) => state.router.params)
  const users = useSelector((state) => state.users)

  // If params update before users, this may show wrong user
  return <div>{users[params.id]?.name}</div>
}

// Solution: Handle loading/transition states
function User() {
  const params = useSelector((state) => state.router.params)
  const users = useSelector((state) => state.users)
  const user = users[params.id]

  if (!user) return <Loading />
  return <div>{user.name}</div>
}
```

### 2. Circular Dependencies

Route actions dispatching actions that trigger re-routing:

```tsx
// Problem: Infinite loop
{
  path: '/users',
  action(context) {
    context.store.dispatch(push('/users')) // Triggers itself!
  }
}

// Solution: Only dispatch if necessary
{
  path: '/users',
  action(context) {
    const state = context.store.getState()
    if (state.router.pathname !== '/users') {
      context.store.dispatch(push('/users'))
    }
  }
}
```

### 3. Not Handling Initial Route

Ensure store is initialized before first render:

```tsx
// Wrong - store not initialized
const store = configureStore({ reducer: { router: routerReducer } })

// Correct - initialize with current location
const store = configureStore({
  reducer: { router: routerReducer },
  preloadedState: {
    router: {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      query: Object.fromEntries(new URLSearchParams(window.location.search)),
    },
  },
})
```

## See Also

- [SPA Navigation](./spa-navigation.md) - Client-side navigation basics
- [Isomorphic Routing](./isomorphic-routing.md) - Server-side rendering
- [Authorization](./authorization.md) - Protected routes
- [redux-first-routing](https://github.com/mksarge/redux-first-routing) - Alternative routing library
- [Universal Router API](./api.md) - Complete API reference
