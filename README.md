<a href="https://www.kriasoft.com/universal-router/" target="_blank">
  <img width="64" height="64" align="right" alt="Visit Universal Router Website"
  src="https://rawgit.com/kriasoft/universal-router/master/logo.svg" />
</a>

# Universal Router

[![NPM version](https://img.shields.io/npm/v/universal-router.svg?style=flat-square&maxAge=3600)](https://www.npmjs.com/package/universal-router)
[![NPM downloads](https://img.shields.io/npm/dm/universal-router.svg?style=flat-square&maxAge=3600)](https://npm-stat.com/charts.html?package=universal-router)
[![Build Status](https://img.shields.io/travis/kriasoft/universal-router/master.svg?style=flat-square&maxAge=3600)](https://travis-ci.org/kriasoft/universal-router)
[![Coverage Status](https://img.shields.io/coveralls/kriasoft/universal-router.svg?style=flat-square&maxAge=3600)](https://coveralls.io/github/kriasoft/universal-router)
[![Dependency Status](https://img.shields.io/david/kriasoft/universal-router.svg?style=flat-square&maxAge=3600)](https://david-dm.org/kriasoft/universal-router)
[![Library Size](http://img.badgesize.io/kriasoft/universal-router/master/dist/universal-router.min.js.svg?compression=gzip&label=size&style=flat-square&maxAge=3600)](https://bundlephobia.com/result?p=universal-router)
[![Online Chat](https://img.shields.io/badge/gitter-join_chat-753a88.svg?style=flat-square&maxAge=3600)](https://gitter.im/kriasoft/universal-router)

A simple middleware-style router that can be used in both client-side and server-side applications.

Visit **[Quickstart Guide](http://slides.com/koistya/universal-router)** (slides) &nbsp;|&nbsp;
Join **[#universal-router](https://gitter.im/kriasoft/universal-router)** on Gitter to stay up to date

## Features

* It has [simple code](https://github.com/kriasoft/universal-router/blob/master/src/UniversalRouter.js)
  with only single [path-to-regexp](https://github.com/pillarjs/path-to-regexp) dependency.
* It can be used with any JavaScript framework such as
  [React](https://reactjs.org/), [Vue](https://vuejs.org/), [Hyperapp](https://hyperapp.js.org/) etc.
* It uses the same middleware approach used in [Express](http://expressjs.com/) and [Koa](http://koajs.com/),
  making it easy to learn.
* It supports both [imperative](https://en.wikipedia.org/wiki/Imperative_programming) and
  [declarative](https://en.wikipedia.org/wiki/Declarative_programming) routing style.
* Routes are plain JavaScript
  [objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer)
  with which you can interact as you like.

## What users say about Universal Router

> Just switched a project over to universal-router.
> Love that the whole thing is a few hundred lines of flexible, easy-to-read code.
>
> -- [Tweet](https://twitter.com/wincent/status/862115805378494464) by **Greg Hurrell** from Facebook

> It does a great job at trying to be _universal_ — it's not tied to any framework,
> it can be run on both server and client, and it's not even tied to history.
> It's a great library which does one thing: routing.
>
> -- [Comment on Reddit](https://www.reddit.com/r/reactjs/comments/5xhw3o#form-t1_dejkw4p367)
> by **@everdimension**

## Installation

Using [npm](https://www.npmjs.com/package/universal-router):

```bash
npm install universal-router --save
```

Or using a [CDN](https://en.wikipedia.org/wiki/Content_delivery_network) like
[unpkg.com](https://unpkg.com/universal-router@latest/universal-router.min.js) or
[jsDelivr](https://cdn.jsdelivr.net/npm/universal-router@latest/universal-router.min.js)
with the following script tag:

```html
<script src="https://unpkg.com/universal-router@latest/universal-router.min.js"></script>
```

You can find the library in `window.UniversalRouter`.

## How does it look like?

```js
import UniversalRouter from 'universal-router'

const routes = [
  {
    path: '', // optional
    action: () => `<h1>Home</h1>`,
  },
  {
    path: '/posts',
    action: () => console.log('checking child routes for /posts'),
    children: [
      {
        path: '', // optional, matches both "/posts" and "/posts/"
        action: () => `<h1>Posts</h1>`,
      },
      {
        path: '/:id',
        action: (context) => `<h1>Post #${context.params.id}</h1>`,
      },
    ],
  },
]

const router = new UniversalRouter(routes)

router.resolve('/posts').then(html => {
  document.body.innerHTML = html // renders: <h1>Posts</h1>
})
```

Play with an example on [JSFiddle](https://jsfiddle.net/frenzzy/b0w9mjck/102/),
[CodePen](https://codepen.io/frenzzy/pen/aWLKpb?editors=0010),
[JS Bin](https://jsbin.com/kaluden/3/edit?js,output) in your browser or try
[RunKit](https://runkit.com/frenzzy/universal-router-demo) node.js playground.

## Documentation

* [Getting Started](https://github.com/kriasoft/universal-router/blob/master/docs/getting-started.md)
* [Universal Router API](https://github.com/kriasoft/universal-router/blob/master/docs/api.md)

## Books and Tutorials

* 🎓 **[ES6 Training Course](https://es6.io/friend/konstantin)**
by [Wes Bos](https://twitter.com/wesbos)
* 📗 **[You Don't Know JS: ES6 & Beyond](http://amzn.to/2bFss85)**
by [Kyle Simpson](https://github.com/getify) (Dec, 2015)
* 📄 **[You might not need React Router](https://medium.freecodecamp.org/38673620f3d)**
by [Konstantin Tarkus](https://twitter.com/koistya)
* 📄 **[An Introduction to the Redux-First Routing Model](https://medium.freecodecamp.org/98926ebf53cb)**
by [Michael Sargent](https://twitter.com/michaelksarge)
* 📄 **[Getting Started with Relay Modern for Building Isomorphic Web Apps](https://hackernoon.com/ae049e4e23c1)**
by [Konstantin Tarkus](https://twitter.com/koistya)

## Browser Support

We support all ES5-compliant browsers, including Internet Explorer 9 and above,
but depending on your target browsers you may need to include
[polyfills](https://en.wikipedia.org/wiki/Polyfill_(programming)) for
[`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map),
[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) and
[`Object.assign`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
before any other code.

For compatibility with older browsers you may also need to include polyfills for
[`Array.isArray`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray)
and [`Object.create`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create).

## Contributing

Anyone and everyone is welcome to
[contribute](https://github.com/kriasoft/universal-router/blob/master/.github/CONTRIBUTING.md) to this project.
The best way to start is by checking our [open issues](https://github.com/kriasoft/universal-router/issues),
submit a [bug report](https://github.com/kriasoft/universal-router/blob/master/.github/CONTRIBUTING.md#bugs) or
[feature request](https://github.com/kriasoft/universal-router/blob/master/.github/CONTRIBUTING.md#features),
participate in discussions, upvote or downvote the issues you like or dislike, send [pull
requests](https://github.com/kriasoft/universal-router/blob/master/.github/CONTRIBUTING.md#pull-requests).

## Support

* [#universal-router](https://gitter.im/kriasoft/universal-router) on Gitter —
  Watch announcements, share ideas and feedback.
* [GitHub Issues](https://github.com/kriasoft/universal-router/issues) —
  Check open issues, send feature requests.
* [@koistya](https://twitter.com/koistya) on [Codementor](https://www.codementor.io/koistya),
  [HackHands](https://hackhands.com/koistya/)
  or [Skype](https://hatscripts.com/addskype?koistya) — Private consulting.

## Related Projects

* [React Starter Kit](https://github.com/kriasoft/react-starter-kit) —
  Boilerplate and tooling for building isomorphic web apps with React and Relay.
* [Node.js API Starter Kit](https://github.com/kriasoft/nodejs-api-starter) —
  Boilerplate and tooling for building data APIs with Docker, Node.js and GraphQL.
* [ASP.NET Core Starter Kit](https://github.com/kriasoft/aspnet-starter-kit) —
  Cross-platform single-page application boilerplate (ASP.NET Core, React, Redux).
* [Babel Starter Kit](https://github.com/kriasoft/babel-starter-kit) —
  Boilerplate for authoring JavaScript/React.js libraries.
* [React App SDK](https://github.com/kriasoft/react-app) —
  Create React apps with just a single dev dependency and zero configuration.
* [React Static Boilerplate](https://github.com/kriasoft/react-static-boilerplate) —
  Single-page application (SPA) starter kit (React, Redux, Webpack, Firebase).
* [History](https://github.com/ReactTraining/history) —
  HTML5 History API wrapper library that handle navigation in single-page apps.
* [Redux-First Routing](https://github.com/mksarge/redux-first-routing) —
  A minimal, framework-agnostic API for accomplishing Redux-first routing.

## Sponsors

Become a sponsor and get your logo on our README on Github with a link to your site.
[[Become a sponsor](https://opencollective.com/universal-router#sponsor)]

<a href="https://opencollective.com/universal-router/sponsor/0/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/0/avatar.svg?2018-01-26" height="64">
</a>
<a href="https://opencollective.com/universal-router/sponsor/1/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/1/avatar.svg?2018-01-26">
</a>
<a href="https://opencollective.com/universal-router/sponsor/2/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/2/avatar.svg?2018-01-26">
</a>
<a href="https://opencollective.com/universal-router/sponsor/3/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/3/avatar.svg?2018-01-26">
</a>
<a href="https://opencollective.com/universal-router/sponsor/4/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/4/avatar.svg?2018-01-26">
</a>
<a href="https://opencollective.com/universal-router/sponsor/5/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/5/avatar.svg?2018-01-26">
</a>
<a href="https://opencollective.com/universal-router/sponsor/6/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/6/avatar.svg?2018-01-26">
</a>
<a href="https://opencollective.com/universal-router/sponsor/7/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/7/avatar.svg?2018-01-26">
</a>
<a href="https://opencollective.com/universal-router/sponsor/8/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/8/avatar.svg?2018-01-26">
</a>
<a href="https://opencollective.com/universal-router/sponsor/9/website" target="_blank">
  <img src="https://opencollective.com/universal-router/sponsor/9/avatar.svg?2018-01-26">
</a>

## Backers

Support us with a monthly donation and help us continue our activities.
[[Become a backer](https://opencollective.com/universal-router#backer)]

<a href="https://opencollective.com/universal-router/backer/0/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/0/avatar.svg?2018-01-26" height="64">
</a>
<a href="https://opencollective.com/universal-router/backer/1/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/1/avatar.svg?2018-01-26">
</a>
<a href="https://opencollective.com/universal-router/backer/2/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/2/avatar.svg?2018-01-26">
</a>
<a href="https://opencollective.com/universal-router/backer/3/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/3/avatar.svg?2018-01-26">
</a>
<a href="https://opencollective.com/universal-router/backer/4/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/4/avatar.svg?2018-01-26">
</a>
<a href="https://opencollective.com/universal-router/backer/5/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/5/avatar.svg?2018-01-26">
</a>
<a href="https://opencollective.com/universal-router/backer/6/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/6/avatar.svg?2018-01-26">
</a>
<a href="https://opencollective.com/universal-router/backer/7/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/7/avatar.svg?2018-01-26">
</a>
<a href="https://opencollective.com/universal-router/backer/8/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/8/avatar.svg?2018-01-26">
</a>
<a href="https://opencollective.com/universal-router/backer/9/website" target="_blank">
  <img src="https://opencollective.com/universal-router/backer/9/avatar.svg?2018-01-26">
</a>

## License

Copyright © 2015-present Kriasoft.
This source code is licensed under the MIT license found in the
[LICENSE.txt](https://github.com/kriasoft/universal-router/blob/master/LICENSE.txt) file.
The documentation to the project is licensed under the
[CC BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/) license.

---
Made with ♥ by
[Konstantin Tarkus](https://github.com/koistya)
([@koistya](https://twitter.com/koistya), [blog](https://medium.com/@tarkus)),
[Vladimir Kutepov](https://github.com/frenzzy)
and [contributors](https://github.com/kriasoft/universal-router/graphs/contributors)
