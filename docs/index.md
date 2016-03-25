---
title: Universal Router ∙ Isomorphic routing solution for JavaScript applications
---

## How to Install

```sh
$ npm install universal-router --save
```

## Basic Routing

Put your routes in a separate file (e.g. `router.js`)

```js
import Router from 'universal-router';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';

const router = new Router(on => {

  on('*', async (state, next) => {         // Matches all URLs
    const component = await next();        // and wraps child components
    return <Layout>{component}</Layout/>;  // into a common layout component
  });
  
  on('/', () => <HomePage />);
  on('/about', () => <AboutPage />);

});

export default router;
```

Reference the router from your application code and dispatch a URL change event:

```js
import React from 'react';
import router from './router.js';
import NotFoundPage from './components/NotFoundPage';
import ErrorPage from './components/ErrorPage';

async function render() {
  const path = window.location.pathname.substr(1) || '/';
  await router.dispatch({ path }, component => {
    React.render(component, document.body);
  });
}

window.addEventListener('hashchange', () => render());
render();
```
