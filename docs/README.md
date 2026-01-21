# Documentation

Welcome to the Universal Router documentation! This guide covers everything from basic setup to advanced patterns.

## Getting Started

- **[Getting Started](./getting-started.md)** - Installation and basic usage
- **[API Reference](./api.md)** - Complete API documentation

## Core Concepts

Essential concepts for understanding how Universal Router works.

- **[Nested Routes](./nested-routes.md)** - Building route hierarchies with shared layouts
- **[Route Matching Order](./route-priorities.md)** - Understanding which route matches first
- **[URL Parameters](./query-params-hash.md)** - Path params, query strings, and hash fragments

## Navigation Patterns

Different approaches to implementing navigation in your application.

- **[Single Page Navigation](./spa-navigation.md)** - Client-side routing with History API
- **[Isomorphic Routing](./isomorphic-routing.md)** - Universal routing (server + client)
- **[Declarative Routing](./declarative-routing.md)** - Custom resolvers for declarative definitions

## Authentication & Authorization

Protecting routes and managing user access.

- **[Authorization](./authorization.md)** - Protected routes and role-based access control
- **[Redirects](./redirects.md)** - Handling redirects

## Navigation UI

Building navigation components for your application.

- **[URL Generation](./url-generation.md)** - Named routes and the `generateUrls` helper
- **[Active Links](./active-links.md)** - Highlighting the current route in navigation
- **[Breadcrumbs](./breadcrumbs.md)** - Building navigation breadcrumbs from route hierarchy
- **[Scroll Behavior](./scroll-behavior.md)** - Managing scroll position on navigation

## Error Handling

Dealing with errors and edge cases.

- **[404 Not Found](./404-not-found.md)** - Error handling and catch-all routes

## User Experience

Enhancing the navigation experience.

- **[Page Transitions](./page-transitions.md)** - Animated transitions between routes

## Performance

Optimizing your routing setup for better performance.

- **[Code Splitting](./code-splitting.md)** - Lazy loading routes with dynamic imports
- **[Synchronous Mode](./synchronous-routing.md)** - Using `UniversalRouterSync` for sync resolution

## Framework Integration

Integrating Universal Router with popular frameworks and tools.

- **[React & Redux](./react-redux.md)** - Redux-first routing patterns
- **[Server Methods](./server-methods.md)** - Handling GET/POST/PUT/DELETE on the server
- **[Hot Module Replacement](./hmr.md)** - Development setup with Vite and Webpack

## Advanced Topics

Advanced patterns and specialized use cases.

- **[TypeScript](./typescript.md)** - Type-safe routes, parameters, and URL generation
- **[Internationalization](./i18n.md)** - Localized URLs and multilingual applications

---

## Quick Reference

| Recipe                                        | Use Case                                   |
| --------------------------------------------- | ------------------------------------------ |
| [SPA Navigation](./spa-navigation.md)         | Client-side routing in the browser         |
| [Isomorphic Routing](./isomorphic-routing.md) | Server-side rendering with React           |
| [Code Splitting](./code-splitting.md)         | Lazy loading for better performance        |
| [Authorization](./authorization.md)           | Protecting routes from unauthorized access |
| [TypeScript](./typescript.md)                 | Type-safe routing with full IntelliSense   |
| [URL Generation](./url-generation.md)         | Building URLs from route names             |

---

## Request a Recipe

Don't see what you need? [Request a recipe](https://github.com/kriasoft/universal-router/issues/new) and we'll add it to the documentation.
