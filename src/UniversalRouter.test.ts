/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import UniversalRouter, { Route } from './UniversalRouter'

test('requires routes', () => {
  // @ts-expect-error missing argument
  expect(() => new UniversalRouter()).toThrow(/Invalid routes/)
  // @ts-expect-error wrong argument
  expect(() => new UniversalRouter(12)).toThrow(/Invalid routes/)
  // @ts-expect-error wrong argument
  expect(() => new UniversalRouter(null)).toThrow(/Invalid routes/)
})

test('supports custom route resolver', async () => {
  const resolveRoute: jest.Mock = jest.fn((context) => context.route.component)
  const action: jest.Mock = jest.fn()
  const router = new UniversalRouter(
    {
      path: '/a',
      action,
      children: [
        { path: '/:b', component: null, action } as Route,
        { path: '/c', component: 'c', action } as Route,
        { path: '/d', component: 'd', action } as Route,
      ],
    },
    { resolveRoute },
  )
  await expect(router.resolve('/a/c')).resolves.toBe('c')
  expect(resolveRoute.mock.calls.length).toBe(3)
  expect(action.mock.calls.length).toBe(0)
})

test('supports custom error handler', async () => {
  const errorHandler: jest.Mock = jest.fn(() => 'result')
  const router = new UniversalRouter([], { errorHandler })
  await expect(router.resolve('/')).resolves.toBe('result')
  expect(errorHandler.mock.calls.length).toBe(1)
  const error = errorHandler.mock.calls[0][0]
  const context = errorHandler.mock.calls[0][1]
  expect(error).toBeInstanceOf(Error)
  expect(error.message).toBe('Route not found')
  expect(error.status).toBe(404)
  expect(context.pathname).toBe('/')
  expect(context.router).toBe(router)
})

test('handles route errors', async () => {
  const errorHandler: jest.Mock = jest.fn(() => 'result')
  const route = {
    path: '/',
    action: (): never => {
      throw new Error('custom')
    },
  }
  const router = new UniversalRouter(route, { errorHandler })
  await expect(router.resolve('/')).resolves.toBe('result')
  expect(errorHandler.mock.calls.length).toBe(1)
  const error = errorHandler.mock.calls[0][0]
  const context = errorHandler.mock.calls[0][1]
  expect(error).toBeInstanceOf(Error)
  expect(error.message).toBe('custom')
  expect(context.pathname).toBe('/')
  expect(context.path).toBe('/')
  expect(context.router).toBe(router)
  expect(context.route).toBe(route)
})

test('throws when route not found', async () => {
  const router = new UniversalRouter([])
  let err: any
  try {
    await router.resolve('/')
  } catch (e) {
    err = e
  }
  expect(err).toBeInstanceOf(Error)
  expect(err.message).toBe('Route not found')
  expect(err.status).toBe(404)
})

test("executes the matching route's action method and return its result", async () => {
  const action: jest.Mock = jest.fn(() => 'b')
  const router = new UniversalRouter({ path: '/a', action })
  await expect(router.resolve('/a')).resolves.toBe('b')
  expect(action.mock.calls.length).toBe(1)
  expect(action.mock.calls[0][0]).toHaveProperty('path', '/a')
})

test('finds the first route whose action method !== undefined or null', async () => {
  const action1: jest.Mock = jest.fn(() => undefined)
  const action2: jest.Mock = jest.fn(() => null)
  const action3: jest.Mock = jest.fn(() => 'c')
  const action4: jest.Mock = jest.fn(() => 'd')
  const router = new UniversalRouter([
    { path: '/a', action: action1 },
    { path: '/a', action: action2 },
    { path: '/a', action: action3 },
    { path: '/a', action: action4 },
  ])
  await expect(router.resolve('/a')).resolves.toBe('c')
  expect(action1.mock.calls.length).toBe(1)
  expect(action2.mock.calls.length).toBe(1)
  expect(action3.mock.calls.length).toBe(1)
  expect(action4.mock.calls.length).toBe(0)
})

test('allows to pass context variables to action methods', async () => {
  const action: jest.Mock = jest.fn(() => true)
  const router = new UniversalRouter([{ path: '/a', action }])
  await expect(router.resolve({ pathname: '/a', test: 'b' })).resolves.toBe(true)
  expect(action.mock.calls.length).toBe(1)
  expect(action.mock.calls[0][0]).toHaveProperty('path', '/a')
  expect(action.mock.calls[0][0]).toHaveProperty('test', 'b')
})

test('skips action methods of routes that do not match the URL path', async () => {
  const action: jest.Mock = jest.fn()
  const router = new UniversalRouter([{ path: '/a', action }])
  let err: any
  try {
    await router.resolve('/b')
  } catch (e) {
    err = e
  }
  expect(err).toBeInstanceOf(Error)
  expect(err.message).toBe('Route not found')
  expect(err.status).toBe(404)
  expect(action.mock.calls.length).toBe(0)
})

test('supports asynchronous route actions', async () => {
  const router = new UniversalRouter([{ path: '/a', action: async (): Promise<string> => 'b' }])
  await expect(router.resolve('/a')).resolves.toBe('b')
})

test('captures URL parameters to context.params', async () => {
  const action: jest.Mock = jest.fn(() => true)
  const router = new UniversalRouter([{ path: '/:one/:two', action }])
  await expect(router.resolve({ pathname: '/a/b' })).resolves.toBe(true)
  expect(action.mock.calls.length).toBe(1)
  expect(action.mock.calls[0][0]).toHaveProperty('params', { one: 'a', two: 'b' })
})

test('provides all URL parameters to each route', async () => {
  const action1: jest.Mock = jest.fn()
  const action2: jest.Mock = jest.fn(() => true)
  const router = new UniversalRouter([
    {
      path: '/:one',
      action: action1,
      children: [
        {
          path: '/:two',
          action: action2,
        },
      ],
    },
  ])
  await expect(router.resolve({ pathname: '/a/b' })).resolves.toBe(true)
  expect(action1.mock.calls.length).toBe(1)
  expect(action1.mock.calls[0][0]).toHaveProperty('params', { one: 'a' })
  expect(action2.mock.calls.length).toBe(1)
  expect(action2.mock.calls[0][0]).toHaveProperty('params', { one: 'a', two: 'b' })
})

test('overrides URL parameters with same name in child routes', async () => {
  const action1: jest.Mock = jest.fn()
  const action2: jest.Mock = jest.fn(() => true)
  const router = new UniversalRouter([
    {
      path: '/:one',
      action: action1,
      children: [
        {
          path: '/:one',
          action: action1,
        },
        {
          path: '/:two',
          action: action2,
        },
      ],
    },
  ])
  await expect(router.resolve({ pathname: '/a/b' })).resolves.toBe(true)
  expect(action1.mock.calls.length).toBe(2)
  expect(action1.mock.calls[0][0]).toHaveProperty('params', { one: 'a' })
  expect(action1.mock.calls[1][0]).toHaveProperty('params', { one: 'b' })
  expect(action2.mock.calls.length).toBe(1)
  expect(action2.mock.calls[0][0]).toHaveProperty('params', { one: 'a', two: 'b' })
})

test('does not collect parameters from previous routes', async () => {
  const action1: jest.Mock = jest.fn(() => undefined)
  const action2: jest.Mock = jest.fn(() => undefined)
  const action3: jest.Mock = jest.fn(() => true)
  const router = new UniversalRouter([
    {
      path: '/:one',
      action: action1,
      children: [
        {
          path: '/:two',
          action: action1,
        },
      ],
    },
    {
      path: '/:three',
      action: action2,
      children: [
        {
          path: '/:four',
          action: action2,
        },
        {
          path: '/:five',
          action: action3,
        },
      ],
    },
  ])
  await expect(router.resolve({ pathname: '/a/b' })).resolves.toBe(true)
  expect(action1.mock.calls.length).toBe(2)
  expect(action1.mock.calls[0][0]).toHaveProperty('params', { one: 'a' })
  expect(action1.mock.calls[1][0]).toHaveProperty('params', { one: 'a', two: 'b' })
  expect(action2.mock.calls.length).toBe(2)
  expect(action2.mock.calls[0][0]).toHaveProperty('params', { three: 'a' })
  expect(action2.mock.calls[1][0]).toHaveProperty('params', { three: 'a', four: 'b' })
  expect(action3.mock.calls.length).toBe(1)
  expect(action3.mock.calls[0][0]).toHaveProperty('params', { three: 'a', five: 'b' })
})

test('supports next() across multiple routes', async () => {
  const log: number[] = []
  const router = new UniversalRouter([
    {
      path: '/test',
      children: [
        {
          path: '',
          action(): void {
            log.push(2)
          },
          children: [
            {
              path: '',
              action({ next }): Promise<void> {
                log.push(3)
                return next().then(() => {
                  log.push(6)
                })
              },
              children: [
                {
                  path: '',
                  action({ next }): Promise<void> {
                    log.push(4)
                    return next().then(() => {
                      log.push(5)
                    })
                  },
                },
              ],
            },
          ],
        },
        {
          path: '',
          action(): void {
            log.push(7)
          },
          children: [
            {
              path: '',
              action(): void {
                log.push(8)
              },
            },
            {
              path: '(.*)',
              action(): void {
                log.push(9)
              },
            },
          ],
        },
      ],
      async action({ next }) {
        log.push(1)
        const result = await next()
        log.push(10)
        return result
      },
    },
    {
      path: '/:id',
      action(): void {
        log.push(11)
      },
    },
    {
      path: '/test',
      action(): string {
        log.push(12)
        return 'done'
      },
    },
    {
      path: '/*',
      action(): void {
        log.push(13)
      },
    },
  ])

  await expect(router.resolve('/test')).resolves.toBe('done')
  expect(log).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
})

test('supports next(true) across multiple routes', async () => {
  const log: number[] = []
  const router = new UniversalRouter({
    action({ next }): Promise<unknown> {
      log.push(1)
      return next().then((result) => {
        log.push(9)
        return result
      })
    },
    children: [
      {
        path: '/a/b/c',
        action({ next }): Promise<unknown> {
          log.push(2)
          return next(true).then((result) => {
            log.push(8)
            return result
          })
        },
      },
      {
        path: '/a',
        action(): void {
          log.push(3)
        },
        children: [
          {
            path: '/b',
            action({ next }): Promise<unknown> {
              log.push(4)
              return next().then((result) => {
                log.push(6)
                return result
              })
            },
            children: [
              {
                path: '/c',
                action(): void {
                  log.push(5)
                },
              },
            ],
          },
          {
            path: '/b/c',
            action(): string {
              log.push(7)
              return 'done'
            },
          },
        ],
      },
    ],
  })

  await expect(router.resolve('/a/b/c')).resolves.toBe('done')
  expect(log).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
})

test('supports parametrized routes', async () => {
  const action: jest.Mock = jest.fn(() => true)
  const router = new UniversalRouter([{ path: '/path/:a/other/:b', action }])
  await expect(router.resolve('/path/1/other/2')).resolves.toBe(true)
  expect(action.mock.calls.length).toBe(1)
  expect(action.mock.calls[0][0]).toHaveProperty('params.a', '1')
  expect(action.mock.calls[0][0]).toHaveProperty('params.b', '2')
  expect(action.mock.calls[0][1]).toHaveProperty('a', '1')
  expect(action.mock.calls[0][1]).toHaveProperty('b', '2')
})

test('supports nested routes (1)', async () => {
  const action1: jest.Mock = jest.fn()
  const action2: jest.Mock = jest.fn(() => true)
  const router = new UniversalRouter([
    {
      path: '',
      action: action1,
      children: [
        {
          path: '/a',
          action: action2,
        },
      ],
    },
  ])

  await expect(router.resolve('/a')).resolves.toBe(true)
  expect(action1.mock.calls.length).toBe(1)
  expect(action1.mock.calls[0][0]).toHaveProperty('path', '')
  expect(action2.mock.calls.length).toBe(1)
  expect(action2.mock.calls[0][0]).toHaveProperty('path', '/a')
})

test('supports nested routes (2)', async () => {
  const action1: jest.Mock = jest.fn()
  const action2: jest.Mock = jest.fn(() => true)
  const router = new UniversalRouter([
    {
      path: '/a',
      action: action1,
      children: [
        {
          path: '/b',
          action: action2,
        },
      ],
    },
  ])

  await expect(router.resolve('/a/b')).resolves.toBe(true)
  expect(action1.mock.calls.length).toBe(1)
  expect(action1.mock.calls[0][0]).toHaveProperty('path', '/a')
  expect(action2.mock.calls.length).toBe(1)
  expect(action2.mock.calls[0][0]).toHaveProperty('path', '/b')
})

test('supports nested routes (3)', async () => {
  const action1: jest.Mock = jest.fn(() => undefined)
  const action2: jest.Mock = jest.fn(() => null)
  const action3: jest.Mock = jest.fn(() => true)
  const router = new UniversalRouter([
    {
      path: '/a',
      action: action1,
      children: [
        {
          path: '/b',
          action: action2,
        },
      ],
    },
    {
      path: '/a/b',
      action: action3,
    },
  ])

  await expect(router.resolve('/a/b')).resolves.toBe(true)
  expect(action1.mock.calls.length).toBe(1)
  expect(action1.mock.calls[0][0]).toHaveProperty('baseUrl', '')
  expect(action1.mock.calls[0][0]).toHaveProperty('path', '/a')
  expect(action2.mock.calls.length).toBe(1)
  expect(action2.mock.calls[0][0]).toHaveProperty('baseUrl', '/a')
  expect(action2.mock.calls[0][0]).toHaveProperty('path', '/b')
  expect(action3.mock.calls.length).toBe(1)
  expect(action3.mock.calls[0][0]).toHaveProperty('baseUrl', '')
  expect(action3.mock.calls[0][0]).toHaveProperty('path', '/a/b')
})

test('re-throws an error', async () => {
  const error = new Error('test error')
  const router = new UniversalRouter([
    {
      path: '/a',
      action(): never {
        throw error
      },
    },
  ])
  let err
  try {
    await router.resolve('/a')
  } catch (e) {
    err = e
  }
  expect(err).toBe(error)
})

test('respects baseUrl', async () => {
  const action: jest.Mock = jest.fn(() => 17)
  const routes = {
    path: '/a',
    children: [
      {
        path: '/b',
        children: [{ path: '/c', action }],
      },
    ],
  }
  const router = new UniversalRouter(routes, { baseUrl: '/base' })
  await expect(router.resolve('/base/a/b/c')).resolves.toBe(17)
  expect(action.mock.calls.length).toBe(1)
  expect(action.mock.calls[0][0]).toHaveProperty('pathname', '/base/a/b/c')
  expect(action.mock.calls[0][0]).toHaveProperty('path', '/c')
  expect(action.mock.calls[0][0]).toHaveProperty('baseUrl', '/base/a/b')
  expect(action.mock.calls[0][0]).toHaveProperty('route', routes.children[0].children[0])
  expect(action.mock.calls[0][0]).toHaveProperty('router', router)

  let err: any
  try {
    await router.resolve('/a/b/c')
  } catch (e) {
    err = e
  }
  expect(action.mock.calls.length).toBe(1)
  expect(err).toBeInstanceOf(Error)
  expect(err.message).toBe('Route not found')
  expect(err.status).toBe(404)
})

test('matches routes with trailing slashes', async () => {
  const router = new UniversalRouter([
    { path: '/', action: (): string => 'a' },
    { path: '/page/', action: (): string => 'b' },
    {
      path: '/child',
      children: [
        { path: '/', action: (): string => 'c' },
        { path: '/page/', action: (): string => 'd' },
      ],
    },
  ])
  await expect(router.resolve('/')).resolves.toBe('a')
  await expect(router.resolve('/page/')).resolves.toBe('b')
  await expect(router.resolve('/child/')).resolves.toBe('c')
  await expect(router.resolve('/child/page/')).resolves.toBe('d')
})

test('skips nested routes when middleware route returns null', async () => {
  const middleware: jest.Mock = jest.fn(() => null)
  const action: jest.Mock = jest.fn(() => 'skipped')
  const router = new UniversalRouter([
    {
      path: '/match',
      action: middleware,
      children: [{ action }],
    },
    {
      path: '/match',
      action: (): number => 404,
    },
  ])

  await expect(router.resolve('/match')).resolves.toBe(404)
  expect(action.mock.calls.length).toBe(0)
  expect(middleware.mock.calls.length).toBe(1)
})

test('matches nested routes when middleware route returns undefined', async () => {
  const middleware: jest.Mock = jest.fn(() => undefined)
  const action: jest.Mock = jest.fn(() => null)
  const router = new UniversalRouter([
    {
      path: '/match',
      action: middleware,
      children: [{ action }],
    },
    {
      path: '/match',
      action: (): number => 404,
    },
  ])

  await expect(router.resolve('/match')).resolves.toBe(404)
  expect(action.mock.calls.length).toBe(1)
  expect(middleware.mock.calls.length).toBe(1)
})

test('handles route not found error correctly', async () => {
  const router = new UniversalRouter({
    path: '/',
    action({ next }): unknown {
      return next()
    },
    children: [{ path: '/child' }],
  })

  let err: any
  try {
    await router.resolve('/404')
  } catch (e) {
    err = e
  }
  expect(err).toBeInstanceOf(Error)
  expect(err.message).toBe('Route not found')
  expect(err.status).toBe(404)
})

test('handles malformed URI params', async () => {
  const router = new UniversalRouter({ path: '/:a', action: (ctx): object => ctx.params })
  await expect(router.resolve('/%AF')).resolves.toStrictEqual({ a: '%AF' })
})

test('decodes params correctly', async () => {
  const router = new UniversalRouter({ path: '/:a/:b/:c', action: (ctx): object => ctx.params })
  await expect(router.resolve('/%2F/%3A/caf%C3%A9')).resolves.toStrictEqual({
    a: '/',
    b: ':',
    c: 'café',
  })
})

test('decodes repeated parameters correctly', async () => {
  const router = new UniversalRouter({ path: '/:a+', action: (ctx): object => ctx.params })
  await expect(router.resolve('/x%2Fy/z/%20/%AF')).resolves.toStrictEqual({
    a: ['x/y', 'z', ' ', '%AF'],
  })
})

test('matches 0 routes (1)', async () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = { path: '/', action }
  await expect(new UniversalRouter(route).resolve('/a')).rejects.toThrow(/Route not found/)
  expect(action.mock.calls.length).toBe(0)
})

test('matches 0 routes (2)', async () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = { path: '/a', action }
  await expect(new UniversalRouter(route).resolve('/')).rejects.toThrow(/Route not found/)
  expect(action.mock.calls.length).toBe(0)
})

test('matches 0 routes (3)', async () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = { path: '/a', action, children: [{ path: '/b', action }] }
  await expect(new UniversalRouter(route).resolve('/b')).rejects.toThrow(/Route not found/)
  expect(action.mock.calls.length).toBe(0)
})

test('matches 0 routes (4)', async () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = { path: 'a', action, children: [{ path: 'b', action }] }
  await expect(new UniversalRouter(route).resolve('ab')).rejects.toThrow(/Route not found/)
  expect(action.mock.calls.length).toBe(0)
})

test('matches 0 routes (5)', async () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = { action }
  await expect(new UniversalRouter(route).resolve('/a')).rejects.toThrow(/Route not found/)
  expect(action.mock.calls.length).toBe(0)
})

test('matches 0 routes (6)', async () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = { path: '/', action }
  await expect(new UniversalRouter(route).resolve('')).rejects.toThrow(/Route not found/)
  expect(action.mock.calls.length).toBe(0)
})

test('matches 0 routes (7)', async () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = { path: '/:a+', action, children: [] }
  await expect(new UniversalRouter(route).resolve('')).rejects.toThrow(/Route not found/)
  expect(action.mock.calls.length).toBe(0)
})

test('matches 1 route (1)', async () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = {
    path: '/',
    action,
  }
  await expect(new UniversalRouter(route).resolve('/')).resolves.toBe(true)
  expect(action.mock.calls.length).toBe(1)
  const context = action.mock.calls[0][0]
  expect(context).toHaveProperty('baseUrl', '')
  expect(context).toHaveProperty('path', '/')
  expect(context).toHaveProperty('route.path', '/')
})

test('matches 1 route (2)', async () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = {
    path: '/a',
    action,
  }
  await expect(new UniversalRouter(route).resolve('/a')).resolves.toBe(true)
  expect(action.mock.calls.length).toBe(1)
  const context = action.mock.calls[0][0]
  expect(context).toHaveProperty('baseUrl', '')
  expect(context).toHaveProperty('path', '/a')
  expect(context).toHaveProperty('route.path', '/a')
})

test('matches 2 routes (1)', async () => {
  const action: jest.Mock = jest.fn(() => undefined)
  const route = {
    path: '',
    action,
    children: [
      {
        path: '/a',
        action,
      },
    ],
  }
  await expect(new UniversalRouter(route).resolve('/a')).rejects.toThrow(/Route not found/)
  expect(action.mock.calls.length).toBe(2)
  const context1 = action.mock.calls[0][0]
  expect(context1).toHaveProperty('baseUrl', '')
  expect(context1).toHaveProperty('path', '')
  expect(context1).toHaveProperty('route.path', '')
  const context2 = action.mock.calls[1][0]
  expect(context2).toHaveProperty('baseUrl', '')
  expect(context2).toHaveProperty('path', '/a')
  expect(context2).toHaveProperty('route.path', '/a')
})

test('matches 2 routes (2)', async () => {
  const action: jest.Mock = jest.fn(() => undefined)
  const route = {
    path: '/a',
    action,
    children: [
      {
        path: '/b',
        action,
        children: [
          {
            path: '/c',
            action,
          },
        ],
      },
    ],
  }
  await expect(new UniversalRouter(route).resolve('/a/b/c')).rejects.toThrow(/Route not found/)
  expect(action.mock.calls.length).toBe(3)
  const context1 = action.mock.calls[0][0]
  expect(context1).toHaveProperty('baseUrl', '')
  expect(context1).toHaveProperty('route.path', '/a')
  const context2 = action.mock.calls[1][0]
  expect(context2).toHaveProperty('baseUrl', '/a')
  expect(context2).toHaveProperty('route.path', '/b')
  const context3 = action.mock.calls[2][0]
  expect(context3).toHaveProperty('baseUrl', '/a/b')
  expect(context3).toHaveProperty('route.path', '/c')
})

test('matches 2 routes (3)', async () => {
  const action: jest.Mock = jest.fn(() => undefined)
  const route = {
    path: '',
    action,
    children: [
      {
        path: '',
        action,
      },
    ],
  }
  await expect(new UniversalRouter(route).resolve('/')).rejects.toThrow(/Route not found/)
  expect(action.mock.calls.length).toBe(2)
  const context1 = action.mock.calls[0][0]
  expect(context1).toHaveProperty('baseUrl', '')
  expect(context1).toHaveProperty('route.path', '')
  const context2 = action.mock.calls[1][0]
  expect(context2).toHaveProperty('baseUrl', '')
  expect(context2).toHaveProperty('route.path', '')
})

test('matches an array of paths', async () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = { path: ['/e', '/f'], action }
  await expect(new UniversalRouter(route).resolve('/f')).resolves.toBe(true)
  expect(action.mock.calls.length).toBe(1)
  const context = action.mock.calls[0][0]
  expect(context).toHaveProperty('baseUrl', '')
  expect(context).toHaveProperty('route.path', ['/e', '/f'])
})
