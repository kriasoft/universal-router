# Isomorphic (universal) routing with React and Express

```js
// src/history.js
import createBrowserHistory from 'history/createBrowserHistory';
export default createBrowserHistory();
```

```jsx
// src/routes.js
import React from 'react';
import history from './history';

function onClick(event) {
  event.preventDefault(); // prevent full page reload
  history.push(event.currentTarget.getAttribute('href')); // do SPA navigation
}

export default {
  path: '/',
  children: [
    {
      path: '/',
      action() {
        return {
          title: 'Welcome!',
          component: (
            <main>
              <h1>Hello, World!</h1>
              <nav>
                Navigation:
                <ul>
                  <li><a href="/" onClick={onClick}>Home</a></li>
                  <li><a href="/about" onClick={onClick}>About Us</a></li>
                  <li><a href="/users" onClick={onClick}>Users</a></li>
                  <li><a href="/articles" onClick={onClick}>Articles</a></li>
                  <li><a href="/404" onClick={onClick}>404</a></li>
                </ul>
              </nav>
            </main>
          ),
        };
      },
    },
    {
      path: '/about',
      action() {
        return {
          title: 'About Us',
          component: <h1>About Us</h1>,
        };
      },
    },
    {
      path: '/users',
      children: [
        {
          path: '/',
          async action() {
            const users = await fetch('/api/users');
            return {
              title: 'Users',
              component: <Users users={users} />,
            };
          },
        },
        {
          path: '/:user',
          async action({ params }) {
            const user = await fetch(`/api/user/${params.user}`);
            return {
              title: user.name,
              component: <User user={user} />,
            };
          },
        }
      ],
    },
    {
      path: '/articles',
      async action() {
        const articles = await fetch(
          'https://gist.githubusercontent.com/koistya/a32919e847531320675764e7308b796a' +
          '/raw/fcbb12e60f8e664240c66bedd747978b16781231/articles.json'
        );
        return {
          title: 'Articles',
          component: (
            <main>
              <h1>Articles</h1>
              <ul>
                {articles.map(article =>
                  <li><a href={article.url}>{article.title}</a></li>
                )}
              </ul>
            </main>
          ),
        };
      },
    },
    {
      path: '*', // wildcard route (must go last)
      action() {
        return {
          title: 'Page Not Found',
          component: <h1>Not Found</h1>,
        };
      },
    },
  ],
};
```

```js
// src/client.js
import UniversalRouter from 'universal-router';
import ReactDOM from 'react-dom';
import history from './history';
import routes from './routes';

function render(location) {
  UniversalRouter.resolve(routes, location.pathname).then(route => {
    document.title = route.title;
    ReactDOM.render(route.component, document.body);
  });
}

render(history.location); // initialize the app
history.listen(location => render); // listen for client-side navigation
```

```js
// src/server.js
import 'node-fetch'; // Fetch polyfill
import express from 'express';
import UniversalRouter from 'universal-router';
import ReactDOM from 'react-dom/server';
import routes from './routes';

const app = express();
const port = 3000;

app.get('*', (req, res, next) => {
  UniversalRouter.resolve(routes, req.path).then(route => {
    res.send(
      `<!doctype html>
      <html>
        <head><title>${route.title}</title></head>
        <body>${ReactDOM.renderToString(route.component)}</body>
      </html>`
    );
  });
});

app.listen(port, () => {
  console.log(`The server is running at http://localhost:${port}/`);
});
```
