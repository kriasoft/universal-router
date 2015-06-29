---
title: Routing and Navigation for React.js
---

# Routing and Navigation for React.js

#### Table of Contents

 1. [How to Install](#how-to-install)
 2. [Basic Routing](#basic-routing)
 3. [Async Routes](#async-routes)
 4. Nested Routes
 5. Integration with Flux
 6. Server-side Rendering
 7. [Test-home-page](home)

## How to Install

```sh
$ npm install react-routing --save
```

## Basic Routing

```js
// router.js
import { Router } from 'react-routing';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';

const router = new Router();

router.use('/', <Layout />);
router.route('/', <HomePage />);
router.route('/about', <AboutPage />);

export default router;
```

```js
// app.js
import router from './router.js';
import NotFoundPage from './components/NotFoundPage';
import ErrorPage from './components/ErrorPage';

const container = document.getElementById('app');

async function render() {
  try {
    const path = window.location.path.substr(1) || '/';
    const action = router.match(path);
    const component = action ? await action() || <NotFoundPage path={path} />;
    React.render(component, container);
  } catch (err) {
    React.render(<ErrorPage path={path} error={err} />, container);
  }
}

window.addEventListener('hashchange', () => render());
render();
```

## Async Routes

```js
// router.js
import { Router } from 'react-routing';
import http from './core/http';
import Layout from './components/Layout';
import ProductListing from './components/ProductListing';
import ProductInfo from './components/ProductInfo';

const router = new Router();

router.use('/', <Layout />);
router.route('/products', async () => {
  const data = await http.get('/api/products');
  return <ProductListing {...data} />;
});
router.route('/about', async (ctx, id) => {
  const data = await http.get(`/api/products/${id}`);
  return <ProductInfo {...data} />;
});

export default router;
```

```js
// app.js
import router from './router.js';
import NotFoundPage from './components/NotFoundPage';
import ErrorPage from './components/ErrorPage';

const container = document.getElementById('app');

async function render() {
  try {
    const path = window.location.path.substr(1) || '/';
    const action = router.match(path);
    const component = action ? await action() || <NotFoundPage path={path} />;
    React.render(component, container);
  } catch (err) {
    React.render(<ErrorPage path={path} error={err} />, container);
  }
}

window.addEventListener('hashchange', () => render());
render();
```
