/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import UniversalRouter from '../src/UniversalRouter'

describe('new UniversalRouter(routes, options)', () => {
  it('should throw an error in case of invalid routes', async () => {
    expect(() => new UniversalRouter()).toThrow(/Invalid routes/)
    expect(() => new UniversalRouter(12)).toThrow(/Invalid routes/)
    expect(() => new UniversalRouter(null)).toThrow(/Invalid routes/)
  })

  it('should support custom resolve option for declarative routes', async () => {
    const resolveRoute = jest.fn((context) => context.route.component || undefined)
    const action = jest.fn()
    const router = new UniversalRouter(
      {
        path: '/a',
        action,
        children: [
          { path: '/:b', component: null, action },
          { path: '/c', component: 'c', action },
          { path: '/d', component: 'd', action },
        ],
      },
      { resolveRoute },
    )
    const result = await router.resolve('/a/c')
    expect(resolveRoute.mock.calls.length).toBe(3)
    expect(action.mock.calls.length).toBe(0)
    expect(result).toBe('c')
  })

  it('should support custom error handler option', async () => {
    const errorHandler = jest.fn(() => 'result')
    const router = new UniversalRouter([], { errorHandler })
    const result = await router.resolve('/')
    expect(result).toBe('result')
    expect(errorHandler.mock.calls.length).toBe(1)
    const error = errorHandler.mock.calls[0][0]
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Page not found')
    expect(error.code).toBe(404)
    expect(error.context.pathname).toBe('/')
    expect(error.context.path).toBe(undefined)
    expect(error.context.router).toBe(router)
  })

  it('should handle route errors', async () => {
    const errorHandler = jest.fn(() => 'result')
    const route = {
      path: '/',
      action: () => {
        throw new Error('custom')
      },
    }
    const router = new UniversalRouter(route, { errorHandler })
    const result = await router.resolve('/')
    expect(result).toBe('result')
    expect(errorHandler.mock.calls.length).toBe(1)
    const error = errorHandler.mock.calls[0][0]
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('custom')
    expect(error.code).toBe(500)
    expect(error.context.pathname).toBe('/')
    expect(error.context.path).toBe('/')
    expect(error.context.router).toBe(router)
    expect(error.context.route).toBe(route)
  })
})

describe('router.resolve({ pathname, ...context })', () => {
  it('should throw an error if no route found', async () => {
    const router = new UniversalRouter([])
    let err
    try {
      await router.resolve('/')
    } catch (e) {
      err = e
    }
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Page not found')
    expect(err.code).toBe(404)
    expect(err.context.pathname).toBe('/')
    expect(err.context.path).toBe(undefined)
    expect(err.context.router).toBe(router)
  })

  it("should execute the matching route's action method and return its result", async () => {
    const action = jest.fn(() => 'b')
    const router = new UniversalRouter({ path: '/a', action })
    const result = await router.resolve('/a')
    expect(action.mock.calls.length).toBe(1)
    expect(action.mock.calls[0][0]).toHaveProperty('path', '/a')
    expect(result).toBe('b')
  })

  it('should find the first route whose action method !== undefined or null', async () => {
    const action1 = jest.fn(() => undefined)
    const action2 = jest.fn(() => null)
    const action3 = jest.fn(() => 'c')
    const action4 = jest.fn(() => 'd')
    const router = new UniversalRouter([
      { path: '/a', action: action1 },
      { path: '/a', action: action2 },
      { path: '/a', action: action3 },
      { path: '/a', action: action4 },
    ])
    const result = await router.resolve('/a')
    expect(result).toBe('c')
    expect(action1.mock.calls.length).toBe(1)
    expect(action2.mock.calls.length).toBe(1)
    expect(action3.mock.calls.length).toBe(1)
    expect(action4.mock.calls.length).toBe(0)
  })

  it('should be able to pass context variables to action methods', async () => {
    const action = jest.fn(() => true)
    const router = new UniversalRouter([{ path: '/a', action }])
    const result = await router.resolve({ pathname: '/a', test: 'b' })
    expect(action.mock.calls.length).toBe(1)
    expect(action.mock.calls[0][0]).toHaveProperty('path', '/a')
    expect(action.mock.calls[0][0]).toHaveProperty('test', 'b')
    expect(result).toBe(true)
  })

  it("should not call action methods of routes that don't match the URL path", async () => {
    const action = jest.fn()
    const router = new UniversalRouter([{ path: '/a', action }])
    let err
    try {
      await router.resolve('/b')
    } catch (e) {
      err = e
    }
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Page not found')
    expect(err.code).toBe(404)
    expect(action.mock.calls.length).toBe(0)
  })

  it('should support asynchronous route actions', async () => {
    const router = new UniversalRouter([{ path: '/a', action: async () => 'b' }])
    const result = await router.resolve('/a')
    expect(result).toBe('b')
  })

  it('URL parameters are captured and added to context.params', async () => {
    const action = jest.fn(() => true)
    const router = new UniversalRouter([{ path: '/:one/:two', action }])
    const result = await router.resolve({ pathname: '/a/b' })
    expect(action.mock.calls.length).toBe(1)
    expect(action.mock.calls[0][0]).toHaveProperty('params', { one: 'a', two: 'b' })
    expect(result).toBe(true)
  })

  it('should provide all URL parameters to each route', async () => {
    const action1 = jest.fn()
    const action2 = jest.fn(() => true)
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
    const result = await router.resolve({ pathname: '/a/b' })
    expect(action1.mock.calls.length).toBe(1)
    expect(action1.mock.calls[0][0]).toHaveProperty('params', { one: 'a' })
    expect(action2.mock.calls.length).toBe(1)
    expect(action2.mock.calls[0][0]).toHaveProperty('params', { one: 'a', two: 'b' })
    expect(result).toBe(true)
  })

  it('should override URL parameters with same name in child route', async () => {
    const action1 = jest.fn()
    const action2 = jest.fn(() => true)
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
    const result = await router.resolve({ pathname: '/a/b' })
    expect(action1.mock.calls.length).toBe(2)
    expect(action1.mock.calls[0][0]).toHaveProperty('params', { one: 'a' })
    expect(action1.mock.calls[1][0]).toHaveProperty('params', { one: 'b' })
    expect(action2.mock.calls.length).toBe(1)
    expect(action2.mock.calls[0][0]).toHaveProperty('params', { one: 'a', two: 'b' })
    expect(result).toBe(true)
  })

  it('should not collect parameters from previous routes', async () => {
    const action1 = jest.fn(() => undefined)
    const action2 = jest.fn(() => undefined)
    const action3 = jest.fn(() => true)
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
    const result = await router.resolve({ pathname: '/a/b' })
    expect(action1.mock.calls.length).toBe(2)
    expect(action1.mock.calls[0][0]).toHaveProperty('params', { one: 'a' })
    expect(action1.mock.calls[1][0]).toHaveProperty('params', { one: 'a', two: 'b' })
    expect(action2.mock.calls.length).toBe(2)
    expect(action2.mock.calls[0][0]).toHaveProperty('params', { three: 'a' })
    expect(action2.mock.calls[1][0]).toHaveProperty('params', { three: 'a', four: 'b' })
    expect(action3.mock.calls.length).toBe(1)
    expect(action3.mock.calls[0][0]).toHaveProperty('params', { three: 'a', five: 'b' })
    expect(result).toBe(true)
  })

  it('should support next() across multiple routes', async () => {
    const log = []
    const router = new UniversalRouter([
      {
        path: '/test',
        children: [
          {
            path: '',
            action() {
              log.push(2)
            },
            children: [
              {
                path: '',
                action({ next }) {
                  log.push(3)
                  return next().then(() => {
                    log.push(6)
                  })
                },
                children: [
                  {
                    path: '',
                    action({ next }) {
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
            action() {
              log.push(7)
            },
            children: [
              {
                path: '',
                action() {
                  log.push(8)
                },
              },
              {
                path: '(.*)',
                action() {
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
        action() {
          log.push(11)
        },
      },
      {
        path: '/test',
        action() {
          log.push(12)
          return 'done'
        },
      },
      {
        path: '/*',
        action() {
          log.push(13)
        },
      },
    ])

    const result = await router.resolve('/test')
    expect(log).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(result).toBe('done')
  })

  it('should support next(true) across multiple routes', async () => {
    const log = []
    const router = new UniversalRouter({
      action({ next }) {
        log.push(1)
        return next().then((result) => {
          log.push(9)
          return result
        })
      },
      children: [
        {
          path: '/a/b/c',
          action({ next }) {
            log.push(2)
            return next(true).then((result) => {
              log.push(8)
              return result
            })
          },
        },
        {
          path: '/a',
          action() {
            log.push(3)
          },
          children: [
            {
              path: '/b',
              action({ next }) {
                log.push(4)
                return next().then((result) => {
                  log.push(6)
                  return result
                })
              },
              children: [
                {
                  path: '/c',
                  action() {
                    log.push(5)
                  },
                },
              ],
            },
            {
              path: '/b/c',
              action() {
                log.push(7)
                return 'done'
              },
            },
          ],
        },
      ],
    })

    const result = await router.resolve('/a/b/c')
    expect(log).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(result).toBe('done')
  })

  it('should support parametrized routes 1', async () => {
    const action = jest.fn(() => true)
    const router = new UniversalRouter([{ path: '/path/:a/other/:b', action }])
    const result = await router.resolve('/path/1/other/2')
    expect(action.mock.calls.length).toBe(1)
    expect(action.mock.calls[0][0]).toHaveProperty('params.a', '1')
    expect(action.mock.calls[0][0]).toHaveProperty('params.b', '2')
    expect(action.mock.calls[0][1]).toHaveProperty('a', '1')
    expect(action.mock.calls[0][1]).toHaveProperty('b', '2')
    expect(result).toBe(true)
  })

  it('should support nested routes (1)', async () => {
    const action1 = jest.fn()
    const action2 = jest.fn(() => true)
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

    const result = await router.resolve('/a')
    expect(action1.mock.calls.length).toBe(1)
    expect(action1.mock.calls[0][0]).toHaveProperty('path', '')
    expect(action2.mock.calls.length).toBe(1)
    expect(action2.mock.calls[0][0]).toHaveProperty('path', '/a')
    expect(result).toBe(true)
  })

  it('should support nested routes (2)', async () => {
    const action1 = jest.fn()
    const action2 = jest.fn(() => true)
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

    const result = await router.resolve('/a/b')
    expect(action1.mock.calls.length).toBe(1)
    expect(action1.mock.calls[0][0]).toHaveProperty('path', '/a')
    expect(action2.mock.calls.length).toBe(1)
    expect(action2.mock.calls[0][0]).toHaveProperty('path', '/b')
    expect(result).toBe(true)
  })

  it('should support nested routes (3)', async () => {
    const action1 = jest.fn(() => undefined)
    const action2 = jest.fn(() => null)
    const action3 = jest.fn(() => true)
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

    const result = await router.resolve('/a/b')
    expect(action1.mock.calls.length).toBe(1)
    expect(action1.mock.calls[0][0]).toHaveProperty('baseUrl', '')
    expect(action1.mock.calls[0][0]).toHaveProperty('path', '/a')
    expect(action2.mock.calls.length).toBe(1)
    expect(action2.mock.calls[0][0]).toHaveProperty('baseUrl', '/a')
    expect(action2.mock.calls[0][0]).toHaveProperty('path', '/b')
    expect(action3.mock.calls.length).toBe(1)
    expect(action3.mock.calls[0][0]).toHaveProperty('baseUrl', '')
    expect(action3.mock.calls[0][0]).toHaveProperty('path', '/a/b')
    expect(result).toBe(true)
  })

  it('should re-throw an error', async () => {
    const error = new Error('test error')
    const router = new UniversalRouter([
      {
        path: '/a',
        action() {
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

  it('should respect baseUrl', async () => {
    const action = jest.fn(() => 17)
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
    const result = await router.resolve('/base/a/b/c')
    expect(action.mock.calls.length).toBe(1)
    expect(action.mock.calls[0][0]).toHaveProperty('pathname', '/base/a/b/c')
    expect(action.mock.calls[0][0]).toHaveProperty('path', '/c')
    expect(action.mock.calls[0][0]).toHaveProperty('baseUrl', '/base/a/b')
    expect(action.mock.calls[0][0]).toHaveProperty('route', routes.children[0].children[0])
    expect(action.mock.calls[0][0]).toHaveProperty('router', router)
    expect(result).toBe(17)

    let err
    try {
      await router.resolve('/a/b/c')
    } catch (e) {
      err = e
    }
    expect(action.mock.calls.length).toBe(1)
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Page not found')
    expect(err.code).toBe(404)
    expect(err.context.pathname).toBe('/a/b/c')
    expect(err.context.path).toBe(undefined)
    expect(err.context.router).toBe(router)
  })

  it('should match routes with trailing slashes', async () => {
    const router = new UniversalRouter([
      { path: '/', action: () => 'a' },
      { path: '/page/', action: () => 'b' },
      {
        path: '/child',
        children: [{ path: '/', action: () => 'c' }, { path: '/page/', action: () => 'd' }],
      },
    ])
    expect(await router.resolve('/')).toBe('a')
    expect(await router.resolve('/page/')).toBe('b')
    expect(await router.resolve('/child/')).toBe('c')
    expect(await router.resolve('/child/page/')).toBe('d')
  })

  it('should skip nested routes when middleware route returns null', async () => {
    const middleware = jest.fn(() => null)
    const action = jest.fn(() => 'skipped')
    const router = new UniversalRouter([
      {
        path: '/match',
        action: middleware,
        children: [{ action }],
      },
      {
        path: '/match',
        action: () => 404,
      },
    ])

    const result = await router.resolve('/match')
    expect(result).toBe(404)
    expect(action.mock.calls.length).toBe(0)
    expect(middleware.mock.calls.length).toBe(1)
  })

  it('should match nested routes when middleware route returns undefined', async () => {
    const middleware = jest.fn(() => undefined)
    const action = jest.fn(() => null)
    const router = new UniversalRouter([
      {
        path: '/match',
        action: middleware,
        children: [{ action }],
      },
      {
        path: '/match',
        action: () => 404,
      },
    ])

    const result = await router.resolve('/match')
    expect(result).toBe(404)
    expect(action.mock.calls.length).toBe(1)
    expect(middleware.mock.calls.length).toBe(1)
  })
})
