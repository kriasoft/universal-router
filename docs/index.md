---
title: Routing and Navigation for React.js Applications
---

## How to Install

```sh
$ npm install react-routing --save
```

## Basic Routing

Put your routes in a separate file (e.g. `routes.js`)

```js
import { Router } from 'react-routing';
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
import React from 'react;
import router from './router.js';
import NotFoundPage from './components/NotFoundPage';
import ErrorPage from './components/ErrorPage';

async function render() {
  try {
    const path = window.location.path.substr(1) || '/';
    const component = await router.dispatch(path) || <NotFoundPage path={path} />;
    React.render(component, document.body);
  } catch (err) {
    React.render(<ErrorPage error={err} />, document.body);
  }
}

window.addEventListener('hashchange', () => render());
render();
```
