/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import UniversalRouter, { Route } from './UniversalRouterSync'

test('requires routes', () => {
  // @ts-expect-error missing argument
  expect(() => new UniversalRouter()).toThrow(/Invalid routes/)
  // @ts-expect-error wrong argument
  expect(() => new UniversalRouter(12)).toThrow(/Invalid routes/)
  // @ts-expect-error wrong argument
  expect(() => new UniversalRouter(null)).toThrow(/Invalid routes/)
})

test('supports custom route resolver', () => {
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
  expect(router.resolve('/a/c')).toBe('c')
  expect(resolveRoute.mock.calls.length).toBe(3)
  expect(action.mock.calls.length).toBe(0)
})

test('supports custom error handler', () => {
  const errorHandler: jest.Mock = jest.fn(() => 'result')
  const router = new UniversalRouter([], { errorHandler })
  expect(router.resolve('/')).toBe('result')
  expect(errorHandler.mock.calls.length).toBe(1)
  const error = errorHandler.mock.calls[0][0]
  const context = errorHandler.mock.calls[0][1]
  expect(error).toBeInstanceOf(Error)
  expect(error.message).toBe('Route not found')
  expect(error.status).toBe(404)
  expect(context.pathname).toBe('/')
  expect(context.router).toBe(router)
})

test('handles route errors', () => {
  const errorHandler: jest.Mock = jest.fn(() => 'result')
  const route = {
    path: '/',
    action: (): never => {
      throw new Error('custom')
    },
  }
  const router = new UniversalRouter(route, { errorHandler })
  expect(router.resolve('/')).toBe('result')
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

test('throws when route not found', () => {
  const router = new UniversalRouter([])
  let err: any
  try {
    router.resolve('/')
  } catch (e) {
    err = e
  }
  expect(err).toBeInstanceOf(Error)
  expect(err.message).toBe('Route not found')
  expect(err.status).toBe(404)
})

test("executes the matching route's action method and return its result", () => {
  const action: jest.Mock = jest.fn(() => 'b')
  const router = new UniversalRouter({ path: '/a', action })
  expect(router.resolve('/a')).toBe('b')
  expect(action.mock.calls.length).toBe(1)
  expect(action.mock.calls[0][0]).toHaveProperty('path', '/a')
})

test('finds the first route whose action method !== undefined or null', () => {
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
  expect(router.resolve('/a')).toBe('c')
  expect(action1.mock.calls.length).toBe(1)
  expect(action2.mock.calls.length).toBe(1)
  expect(action3.mock.calls.length).toBe(1)
  expect(action4.mock.calls.length).toBe(0)
})

test('allows to pass context variables to action methods', () => {
  const action: jest.Mock = jest.fn(() => true)
  const router = new UniversalRouter([{ path: '/a', action }])
  expect(router.resolve({ pathname: '/a', test: 'b' })).toBe(true)
  expect(action.mock.calls.length).toBe(1)
  expect(action.mock.calls[0][0]).toHaveProperty('path', '/a')
  expect(action.mock.calls[0][0]).toHaveProperty('test', 'b')
})

test('skips action methods of routes that do not match the URL path', () => {
  const action: jest.Mock = jest.fn()
  const router = new UniversalRouter([{ path: '/a', action }])
  let err: any
  try {
    router.resolve('/b')
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

test('captures URL parameters to context.params', () => {
  const action: jest.Mock = jest.fn(() => true)
  const router = new UniversalRouter([{ path: '/:one/:two', action }])
  expect(router.resolve({ pathname: '/a/b' })).toBe(true)
  expect(action.mock.calls.length).toBe(1)
  expect(action.mock.calls[0][0]).toHaveProperty('params', { one: 'a', two: 'b' })
})

test('provides all URL parameters to each route', () => {
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
  expect(router.resolve({ pathname: '/a/b' })).toBe(true)
  expect(action1.mock.calls.length).toBe(1)
  expect(action1.mock.calls[0][0]).toHaveProperty('params', { one: 'a' })
  expect(action2.mock.calls.length).toBe(1)
  expect(action2.mock.calls[0][0]).toHaveProperty('params', { one: 'a', two: 'b' })
})

test('overrides URL parameters with same name in child routes', () => {
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
  expect(router.resolve({ pathname: '/a/b' })).toBe(true)
  expect(action1.mock.calls.length).toBe(2)
  expect(action1.mock.calls[0][0]).toHaveProperty('params', { one: 'a' })
  expect(action1.mock.calls[1][0]).toHaveProperty('params', { one: 'b' })
  expect(action2.mock.calls.length).toBe(1)
  expect(action2.mock.calls[0][0]).toHaveProperty('params', { one: 'a', two: 'b' })
})

test('does not collect parameters from previous routes', () => {
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
  expect(router.resolve({ pathname: '/a/b' })).toBe(true)
  expect(action1.mock.calls.length).toBe(2)
  expect(action1.mock.calls[0][0]).toHaveProperty('params', { one: 'a' })
  expect(action1.mock.calls[1][0]).toHaveProperty('params', { one: 'a', two: 'b' })
  expect(action2.mock.calls.length).toBe(2)
  expect(action2.mock.calls[0][0]).toHaveProperty('params', { three: 'a' })
  expect(action2.mock.calls[1][0]).toHaveProperty('params', { three: 'a', four: 'b' })
  expect(action3.mock.calls.length).toBe(1)
  expect(action3.mock.calls[0][0]).toHaveProperty('params', { three: 'a', five: 'b' })
})

test('supports next() across multiple routes', () => {
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
              action({ next }) {
                log.push(3)
                const result = next()
                log.push(6)
                return result
              },
              children: [
                {
                  path: '',
                  action({ next }) {
                    log.push(4)
                    const result = next()
                    log.push(5)
                    return result
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
      action({ next }) {
        log.push(1)
        const result = next()
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

  expect(router.resolve('/test')).toBe('done')
  expect(log).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
})

test('supports next(true) across multiple routes', () => {
  const log: number[] = []
  const router = new UniversalRouter({
    action({ next }): unknown {
      log.push(1)
      const result = next()
      log.push(9)
      return result
    },
    children: [
      {
        path: '/a/b/c',
        action({ next }): Promise<unknown> {
          log.push(2)
          const result = next(true)
          log.push(8)
          return result
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
              const result = next()
              log.push(6)
              return result
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

  expect(router.resolve('/a/b/c')).toBe('done')
  expect(log).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
})

test('supports parametrized routes', () => {
  const action: jest.Mock = jest.fn(() => true)
  const router = new UniversalRouter([{ path: '/path/:a/other/:b', action }])
  expect(router.resolve('/path/1/other/2')).toBe(true)
  expect(action.mock.calls.length).toBe(1)
  expect(action.mock.calls[0][0]).toHaveProperty('params.a', '1')
  expect(action.mock.calls[0][0]).toHaveProperty('params.b', '2')
  expect(action.mock.calls[0][1]).toHaveProperty('a', '1')
  expect(action.mock.calls[0][1]).toHaveProperty('b', '2')
})

test('supports nested routes (1)', () => {
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

  expect(router.resolve('/a')).toBe(true)
  expect(action1.mock.calls.length).toBe(1)
  expect(action1.mock.calls[0][0]).toHaveProperty('path', '')
  expect(action2.mock.calls.length).toBe(1)
  expect(action2.mock.calls[0][0]).toHaveProperty('path', '/a')
})

test('supports nested routes (2)', () => {
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

  expect(router.resolve('/a/b')).toBe(true)
  expect(action1.mock.calls.length).toBe(1)
  expect(action1.mock.calls[0][0]).toHaveProperty('path', '/a')
  expect(action2.mock.calls.length).toBe(1)
  expect(action2.mock.calls[0][0]).toHaveProperty('path', '/b')
})

test('supports nested routes (3)', () => {
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

  expect(router.resolve('/a/b')).toBe(true)
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

test('re-throws an error', () => {
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
    router.resolve('/a')
  } catch (e) {
    err = e
  }
  expect(err).toBe(error)
})

test('respects baseUrl', () => {
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
  expect(router.resolve('/base/a/b/c')).toBe(17)
  expect(action.mock.calls.length).toBe(1)
  expect(action.mock.calls[0][0]).toHaveProperty('pathname', '/base/a/b/c')
  expect(action.mock.calls[0][0]).toHaveProperty('path', '/c')
  expect(action.mock.calls[0][0]).toHaveProperty('baseUrl', '/base/a/b')
  expect(action.mock.calls[0][0]).toHaveProperty('route', routes.children[0].children[0])
  expect(action.mock.calls[0][0]).toHaveProperty('router', router)

  let err: any
  try {
    router.resolve('/a/b/c')
  } catch (e) {
    err = e
  }
  expect(action.mock.calls.length).toBe(1)
  expect(err).toBeInstanceOf(Error)
  expect(err.message).toBe('Route not found')
  expect(err.status).toBe(404)
})

test('matches routes with trailing slashes', () => {
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
  expect(router.resolve('/')).toBe('a')
  expect(router.resolve('/page/')).toBe('b')
  expect(router.resolve('/child/')).toBe('c')
  expect(router.resolve('/child/page/')).toBe('d')
})

test('skips nested routes when middleware route returns null', () => {
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

  expect(router.resolve('/match')).toBe(404)
  expect(action.mock.calls.length).toBe(0)
  expect(middleware.mock.calls.length).toBe(1)
})

test('matches nested routes when middleware route returns undefined', () => {
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

  expect(router.resolve('/match')).toBe(404)
  expect(action.mock.calls.length).toBe(1)
  expect(middleware.mock.calls.length).toBe(1)
})

test('handles route not found error correctly', () => {
  const router = new UniversalRouter({
    path: '/',
    action({ next }): unknown {
      return next()
    },
    children: [{ path: '/child' }],
  })

  let err: any
  try {
    router.resolve('/404')
  } catch (e) {
    err = e
  }
  expect(err).toBeInstanceOf(Error)
  expect(err.message).toBe('Route not found')
  expect(err.status).toBe(404)
})

test('handles malformed URI params', () => {
  const router = new UniversalRouter({ path: '/:a', action: (ctx): object => ctx.params })
  expect(router.resolve('/%AF')).toStrictEqual({ a: '%AF' })
})

test('decodes params correctly', () => {
  const router = new UniversalRouter({ path: '/:a/:b/:c', action: (ctx): object => ctx.params })
  expect(router.resolve('/%2F/%3A/caf%C3%A9')).toStrictEqual({
    a: '/',
    b: ':',
    c: 'café',
  })
})

test('decodes repeated parameters correctly', () => {
  const router = new UniversalRouter({ path: '/:a+', action: (ctx): object => ctx.params })
  expect(router.resolve('/x%2Fy/z/%20/%AF')).toStrictEqual({
    a: ['x/y', 'z', ' ', '%AF'],
  })
})

test('matches 0 routes (1)', () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = { path: '/', action }
  expect(() => new UniversalRouter(route).resolve('/a')).toThrow(/Route not found/)
  expect(action.mock.calls.length).toBe(0)
})

test('matches 0 routes (2)', () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = { path: '/a', action }
  expect(() => new UniversalRouter(route).resolve('/')).toThrow(/Route not found/)
  expect(action.mock.calls.length).toBe(0)
})

test('matches 0 routes (3)', () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = { path: '/a', action, children: [{ path: '/b', action }] }
  expect(() => new UniversalRouter(route).resolve('/b')).toThrow(/Route not found/)
  expect(action.mock.calls.length).toBe(0)
})

test('matches 0 routes (4)', () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = { path: 'a', action, children: [{ path: 'b', action }] }
  expect(() => new UniversalRouter(route).resolve('ab')).toThrow(/Route not found/)
  expect(action.mock.calls.length).toBe(0)
})

test('matches 0 routes (5)', () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = { action }
  expect(() => new UniversalRouter(route).resolve('/a')).toThrow(/Route not found/)
  expect(action.mock.calls.length).toBe(0)
})

test('matches 0 routes (6)', () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = { path: '/', action }
  expect(() => new UniversalRouter(route).resolve('')).toThrow(/Route not found/)
  expect(action.mock.calls.length).toBe(0)
})

test('matches 0 routes (7)', () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = { path: '/:a+', action, children: [] }
  expect(() => new UniversalRouter(route).resolve('')).toThrow(/Route not found/)
  expect(action.mock.calls.length).toBe(0)
})

test('matches 1 route (1)', () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = {
    path: '/',
    action,
  }
  expect(new UniversalRouter(route).resolve('/')).toBe(true)
  expect(action.mock.calls.length).toBe(1)
  const context = action.mock.calls[0][0]
  expect(context).toHaveProperty('baseUrl', '')
  expect(context).toHaveProperty('path', '/')
  expect(context).toHaveProperty('route.path', '/')
})

test('matches 1 route (2)', () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = {
    path: '/a',
    action,
  }
  expect(new UniversalRouter(route).resolve('/a')).toBe(true)
  expect(action.mock.calls.length).toBe(1)
  const context = action.mock.calls[0][0]
  expect(context).toHaveProperty('baseUrl', '')
  expect(context).toHaveProperty('path', '/a')
  expect(context).toHaveProperty('route.path', '/a')
})

test('matches 2 routes (1)', () => {
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
  expect(() => new UniversalRouter(route).resolve('/a')).toThrow(/Route not found/)
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

test('matches 2 routes (2)', () => {
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
  expect(() => new UniversalRouter(route).resolve('/a/b/c')).toThrow(/Route not found/)
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

test('matches 2 routes (3)', () => {
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
  expect(() => new UniversalRouter(route).resolve('/')).toThrow(/Route not found/)
  expect(action.mock.calls.length).toBe(2)
  const context1 = action.mock.calls[0][0]
  expect(context1).toHaveProperty('baseUrl', '')
  expect(context1).toHaveProperty('route.path', '')
  const context2 = action.mock.calls[1][0]
  expect(context2).toHaveProperty('baseUrl', '')
  expect(context2).toHaveProperty('route.path', '')
})

test('matches an array of paths', () => {
  const action: jest.Mock = jest.fn(() => true)
  const route = { path: ['/e', '/f'], action }
  expect(new UniversalRouter(route).resolve('/f')).toBe(true)
  expect(action.mock.calls.length).toBe(1)
  const context = action.mock.calls[0][0]
  expect(context).toHaveProperty('baseUrl', '')
  expect(context).toHaveProperty('route.path', ['/e', '/f'])
})
