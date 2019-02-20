/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import UniversalRouter from '../src/UniversalRouterSync'

const result1 = new UniversalRouter({
  path: '/users',
  children: [
    {
      path: '',
      action: () => 'Users',
    },
    {
      path: '/:username',
      action(context, params) {
        console.log(context.search)
        return `Profile ${params.username}`
      },
    },
  ],
}).resolve({ pathname: '/users/john', search: '?busy=1' })
console.log(result1)

const result2 = new UniversalRouter(
  {
    name: 'root',
    action: (context) => context.path,
  },
  {
    context: {
      user: 'name',
    },
    baseUrl: '/base',
    resolveRoute(context, params) {
      if (typeof context.route.action === 'function') {
        return context.route.action(context, params)
      }
      return undefined
    },
    errorHandler: (error, context) => {
      console.error(error)
      console.log(context.pathname, context.user)
      return error.status === 404 ? 'Not Found' : 'Something went wrong'
    },
  },
).resolve('/')
console.log(result2)

const result3 = new UniversalRouter([
  {
    action({ next }) {
      console.log('middleware: start')
      const child = next()
      console.log('middleware: end')
      return child
    },
    children: [
      {
        path: '/hello',
        action() {
          console.log('route: return a result')
          return { foo: 'bar' }
        },
      },
    ],
  },
]).resolve('/hello')
console.log(result3.foo)
