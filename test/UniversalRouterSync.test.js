/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import UniversalRouterSync from '../src/UniversalRouterSync'

describe('new UniversalRouterSync(routes, options)', () => {
  it('should throw an error in case of invalid routes', () => {
    expect(() => new UniversalRouterSync()).toThrow(/Invalid routes/)
    expect(() => new UniversalRouterSync(12)).toThrow(/Invalid routes/)
    expect(() => new UniversalRouterSync(null)).toThrow(/Invalid routes/)
  })

  it('should support custom resolve option for declarative routes', () => {
    const resolveRoute = jest.fn((context) => context.route.component || undefined)
    const action = jest.fn()
    const router = new UniversalRouterSync(
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
    const result = router.resolve('/a/c')
    expect(resolveRoute.mock.calls.length).toBe(3)
    expect(action.mock.calls.length).toBe(0)
    expect(result).toBe('c')
  })

  it('should support custom error handler option', () => {
    const errorHandler = jest.fn(() => 'result')
    const router = new UniversalRouterSync([], { errorHandler })
    const result = router.resolve('/')
    expect(result).toBe('result')
    expect(errorHandler.mock.calls.length).toBe(1)
    const error = errorHandler.mock.calls[0][0]
    const context = errorHandler.mock.calls[0][1]
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Route not found')
    expect(error.status).toBe(404)
    expect(context.pathname).toBe('/')
    expect(context.router).toBe(router)
  })

  it('should handle route errors', () => {
    const errorHandler = jest.fn(() => 'result')
    const route = {
      path: '/',
      action: () => {
        throw new Error('custom')
      },
    }
    const router = new UniversalRouterSync(route, { errorHandler })
    const result = router.resolve('/')
    expect(result).toBe('result')
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
})

describe('router.resolve({ pathname, ...context })', () => {
  it('should throw an error if no route found', () => {
    const router = new UniversalRouterSync([])
    let err
    try {
      router.resolve('/')
    } catch (e) {
      err = e
    }
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Route not found')
    expect(err.status).toBe(404)
  })

  it("should execute the matching route's action method and return its result", () => {
    const action = jest.fn(() => 'b')
    const router = new UniversalRouterSync({ path: '/a', action })
    const result = router.resolve('/a')
    expect(action.mock.calls.length).toBe(1)
    expect(action.mock.calls[0][0]).toHaveProperty('path', '/a')
    expect(result).toBe('b')
  })

  it('should find the first route whose action method !== undefined or null', () => {
    const action1 = jest.fn(() => undefined)
    const action2 = jest.fn(() => null)
    const action3 = jest.fn(() => 'c')
    const action4 = jest.fn(() => 'd')
    const router = new UniversalRouterSync([
      { path: '/a', action: action1 },
      { path: '/a', action: action2 },
      { path: '/a', action: action3 },
      { path: '/a', action: action4 },
    ])
    const result = router.resolve('/a')
    expect(result).toBe('c')
    expect(action1.mock.calls.length).toBe(1)
    expect(action2.mock.calls.length).toBe(1)
    expect(action3.mock.calls.length).toBe(1)
    expect(action4.mock.calls.length).toBe(0)
  })

  it('should be able to pass context variables to action methods', () => {
    const action = jest.fn(() => true)
    const router = new UniversalRouterSync([{ path: '/a', action }])
    const result = router.resolve({ pathname: '/a', test: 'b' })
    expect(action.mock.calls.length).toBe(1)
    expect(action.mock.calls[0][0]).toHaveProperty('path', '/a')
    expect(action.mock.calls[0][0]).toHaveProperty('test', 'b')
    expect(result).toBe(true)
  })

  it("should not call action methods of routes that don't match the URL path", () => {
    const action = jest.fn()
    const router = new UniversalRouterSync([{ path: '/a', action }])
    let err
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

  it('should support asynchronous route actions', () => {
    const router = new UniversalRouterSync([{ path: '/a', action: () => 'b' }])
    const result = router.resolve('/a')
    expect(result).toBe('b')
  })

  it('URL parameters are captured and added to context.params', () => {
    const action = jest.fn(() => true)
    const router = new UniversalRouterSync([{ path: '/:one/:two', action }])
    const result = router.resolve({ pathname: '/a/b' })
    expect(action.mock.calls.length).toBe(1)
    expect(action.mock.calls[0][0]).toHaveProperty('params', { one: 'a', two: 'b' })
    expect(result).toBe(true)
  })

  it('should provide all URL parameters to each route', () => {
    const action1 = jest.fn()
    const action2 = jest.fn(() => true)
    const router = new UniversalRouterSync([
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
    const result = router.resolve({ pathname: '/a/b' })
    expect(action1.mock.calls.length).toBe(1)
    expect(action1.mock.calls[0][0]).toHaveProperty('params', { one: 'a' })
    expect(action2.mock.calls.length).toBe(1)
    expect(action2.mock.calls[0][0]).toHaveProperty('params', { one: 'a', two: 'b' })
    expect(result).toBe(true)
  })

  it('should override URL parameters with same name in child route', () => {
    const action1 = jest.fn()
    const action2 = jest.fn(() => true)
    const router = new UniversalRouterSync([
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
    const result = router.resolve({ pathname: '/a/b' })
    expect(action1.mock.calls.length).toBe(2)
    expect(action1.mock.calls[0][0]).toHaveProperty('params', { one: 'a' })
    expect(action1.mock.calls[1][0]).toHaveProperty('params', { one: 'b' })
    expect(action2.mock.calls.length).toBe(1)
    expect(action2.mock.calls[0][0]).toHaveProperty('params', { one: 'a', two: 'b' })
    expect(result).toBe(true)
  })

  it('should not collect parameters from previous routes', () => {
    const action1 = jest.fn(() => undefined)
    const action2 = jest.fn(() => undefined)
    const action3 = jest.fn(() => true)
    const router = new UniversalRouterSync([
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
    const result = router.resolve({ pathname: '/a/b' })
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

  it('should support next() across multiple routes', () => {
    const log = []
    const router = new UniversalRouterSync([
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
                  next()
                  log.push(6)
                },
                children: [
                  {
                    path: '',
                    action({ next }) {
                      log.push(4)
                      next()
                      log.push(5)
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
        action({ next }) {
          log.push(1)
          const result = next()
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

    const result = router.resolve('/test')
    expect(log).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(result).toBe('done')
  })

  it('should support next(true) across multiple routes', () => {
    const log = []
    const router = new UniversalRouterSync({
      action({ next }) {
        log.push(1)
        const result = next()
        log.push(9)
        return result
      },
      children: [
        {
          path: '/a/b/c',
          action({ next }) {
            log.push(2)
            const result = next(true)
            log.push(8)
            return result
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
                const result = next()
                log.push(6)
                return result
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

    const result = router.resolve('/a/b/c')
    expect(log).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(result).toBe('done')
  })

  it('should support parametrized routes 1', () => {
    const action = jest.fn(() => true)
    const router = new UniversalRouterSync([{ path: '/path/:a/other/:b', action }])
    const result = router.resolve('/path/1/other/2')
    expect(action.mock.calls.length).toBe(1)
    expect(action.mock.calls[0][0]).toHaveProperty('params.a', '1')
    expect(action.mock.calls[0][0]).toHaveProperty('params.b', '2')
    expect(action.mock.calls[0][1]).toHaveProperty('a', '1')
    expect(action.mock.calls[0][1]).toHaveProperty('b', '2')
    expect(result).toBe(true)
  })

  it('should support nested routes (1)', () => {
    const action1 = jest.fn()
    const action2 = jest.fn(() => true)
    const router = new UniversalRouterSync([
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

    const result = router.resolve('/a')
    expect(action1.mock.calls.length).toBe(1)
    expect(action1.mock.calls[0][0]).toHaveProperty('path', '')
    expect(action2.mock.calls.length).toBe(1)
    expect(action2.mock.calls[0][0]).toHaveProperty('path', '/a')
    expect(result).toBe(true)
  })

  it('should support nested routes (2)', () => {
    const action1 = jest.fn()
    const action2 = jest.fn(() => true)
    const router = new UniversalRouterSync([
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

    const result = router.resolve('/a/b')
    expect(action1.mock.calls.length).toBe(1)
    expect(action1.mock.calls[0][0]).toHaveProperty('path', '/a')
    expect(action2.mock.calls.length).toBe(1)
    expect(action2.mock.calls[0][0]).toHaveProperty('path', '/b')
    expect(result).toBe(true)
  })

  it('should support nested routes (3)', () => {
    const action1 = jest.fn(() => undefined)
    const action2 = jest.fn(() => null)
    const action3 = jest.fn(() => true)
    const router = new UniversalRouterSync([
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

    const result = router.resolve('/a/b')
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

  it('should re-throw an error', () => {
    const error = new Error('test error')
    const router = new UniversalRouterSync([
      {
        path: '/a',
        action() {
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

  it('should respect baseUrl', () => {
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
    const router = new UniversalRouterSync(routes, { baseUrl: '/base' })
    const result = router.resolve('/base/a/b/c')
    expect(action.mock.calls.length).toBe(1)
    expect(action.mock.calls[0][0]).toHaveProperty('pathname', '/base/a/b/c')
    expect(action.mock.calls[0][0]).toHaveProperty('path', '/c')
    expect(action.mock.calls[0][0]).toHaveProperty('baseUrl', '/base/a/b')
    expect(action.mock.calls[0][0]).toHaveProperty('route', routes.children[0].children[0])
    expect(action.mock.calls[0][0]).toHaveProperty('router', router)
    expect(result).toBe(17)

    let err
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

  it('should match routes with trailing slashes', () => {
    const router = new UniversalRouterSync([
      { path: '/', action: () => 'a' },
      { path: '/page/', action: () => 'b' },
      {
        path: '/child',
        children: [{ path: '/', action: () => 'c' }, { path: '/page/', action: () => 'd' }],
      },
    ])
    expect(router.resolve('/')).toBe('a')
    expect(router.resolve('/page/')).toBe('b')
    expect(router.resolve('/child/')).toBe('c')
    expect(router.resolve('/child/page/')).toBe('d')
  })

  it('should skip nested routes when middleware route returns null', () => {
    const middleware = jest.fn(() => null)
    const action = jest.fn(() => 'skipped')
    const router = new UniversalRouterSync([
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

    const result = router.resolve('/match')
    expect(result).toBe(404)
    expect(action.mock.calls.length).toBe(0)
    expect(middleware.mock.calls.length).toBe(1)
  })

  it('should match nested routes when middleware route returns undefined', () => {
    const middleware = jest.fn(() => undefined)
    const action = jest.fn(() => null)
    const router = new UniversalRouterSync([
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

    const result = router.resolve('/match')
    expect(result).toBe(404)
    expect(action.mock.calls.length).toBe(1)
    expect(middleware.mock.calls.length).toBe(1)
  })
})
