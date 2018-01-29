/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import sinon from 'sinon'
import { expect } from 'chai'
import UniversalRouter from '../src/UniversalRouter'

describe('new UniversalRouter(routes, options)', () => {
  it('should throw an error in case of invalid routes', async () => {
    expect(() => new UniversalRouter()).to.throw(TypeError, /Invalid routes/)
    expect(() => new UniversalRouter(12)).to.throw(TypeError, /Invalid routes/)
    expect(() => new UniversalRouter(null)).to.throw(TypeError, /Invalid routes/)
  })

  it('should support custom resolve option for declarative routes', async () => {
    const resolveRoute = sinon.spy((context) => context.route.component || undefined)
    const action = sinon.spy()
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
    expect(resolveRoute.calledThrice).to.be.true
    expect(action.called).to.be.false
    expect(result).to.be.equal('c')
  })

  it('should support custom error handler option', async () => {
    const errorHandler = sinon.spy(() => 'result')
    const router = new UniversalRouter([], { errorHandler })
    const result = await router.resolve('/')
    expect(result).to.be.equal('result')
    expect(errorHandler.calledOnce).to.be.true
    const error = errorHandler.args[0][0]
    expect(error).to.be.an('error')
    expect(error.message).to.be.equal('Page not found')
    expect(error.code).to.be.equal(404)
    expect(error.context.pathname).to.be.equal('/')
    expect(error.context.path).to.be.equal(undefined)
    expect(error.context.router).to.be.equal(router)
  })

  it('should handle route errors', async () => {
    const errorHandler = sinon.spy(() => 'result')
    const route = {
      path: '/',
      action: () => {
        throw new Error('custom')
      },
    }
    const router = new UniversalRouter(route, { errorHandler })
    const result = await router.resolve('/')
    expect(result).to.be.equal('result')
    expect(errorHandler.calledOnce).to.be.true
    const error = errorHandler.args[0][0]
    expect(error).to.be.an('error')
    expect(error.message).to.be.equal('custom')
    expect(error.code).to.be.equal(500)
    expect(error.context.pathname).to.be.equal('/')
    expect(error.context.path).to.be.equal('/')
    expect(error.context.router).to.be.equal(router)
    expect(error.context.route).to.be.equal(route)
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
    expect(err).to.be.an('error')
    expect(err.message).to.be.equal('Page not found')
    expect(err.code).to.be.equal(404)
    expect(err.context.pathname).to.be.equal('/')
    expect(err.context.path).to.be.equal(undefined)
    expect(err.context.router).to.be.equal(router)
  })

  it("should execute the matching route's action method and return its result", async () => {
    const action = sinon.spy(() => 'b')
    const router = new UniversalRouter({ path: '/a', action })
    const result = await router.resolve('/a')
    expect(action.calledOnce).to.be.true
    expect(action.args[0][0]).to.have.property('path', '/a')
    expect(result).to.be.equal('b')
  })

  it('should find the first route whose action method !== undefined or null', async () => {
    const action1 = sinon.spy(() => undefined)
    const action2 = sinon.spy(() => null)
    const action3 = sinon.spy(() => 'c')
    const action4 = sinon.spy(() => 'd')
    const router = new UniversalRouter([
      { path: '/a', action: action1 },
      { path: '/a', action: action2 },
      { path: '/a', action: action3 },
      { path: '/a', action: action4 },
    ])
    const result = await router.resolve('/a')
    expect(result).to.be.equal('c')
    expect(action1.calledOnce).to.be.true
    expect(action2.calledOnce).to.be.true
    expect(action3.calledOnce).to.be.true
    expect(action4.called).to.be.false
  })

  it('should be able to pass context variables to action methods', async () => {
    const action = sinon.spy(() => true)
    const router = new UniversalRouter([{ path: '/a', action }])
    const result = await router.resolve({ pathname: '/a', test: 'b' })
    expect(action.calledOnce).to.be.true
    expect(action.args[0][0]).to.have.property('path', '/a')
    expect(action.args[0][0]).to.have.property('test', 'b')
    expect(result).to.be.true
  })

  it("should not call action methods of routes that don't match the URL path", async () => {
    const action = sinon.spy()
    const router = new UniversalRouter([{ path: '/a', action }])
    let err
    try {
      await router.resolve('/b')
    } catch (e) {
      err = e
    }
    expect(err).to.be.an('error')
    expect(err.message).to.be.equal('Page not found')
    expect(err.code).to.be.equal(404)
    expect(action.called).to.be.false
  })

  it('should support asynchronous route actions', async () => {
    const router = new UniversalRouter([{ path: '/a', action: async () => 'b' }])
    const result = await router.resolve('/a')
    expect(result).to.be.equal('b')
  })

  it('URL parameters are captured and added to context.params', async () => {
    const action = sinon.spy(() => true)
    const router = new UniversalRouter([{ path: '/:one/:two', action }])
    const result = await router.resolve({ pathname: '/a/b' })
    expect(action.calledOnce).to.be.true
    expect(action.args[0][0])
      .to.have.property('params')
      .that.deep.equals({ one: 'a', two: 'b' })
    expect(result).to.be.true
  })

  it('should provide all URL parameters to each route', async () => {
    const action1 = sinon.spy()
    const action2 = sinon.spy(() => true)
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
    expect(action1.calledOnce).to.be.true
    expect(action1.args[0][0])
      .to.have.property('params')
      .that.deep.equals({ one: 'a' })
    expect(action2.calledOnce).to.be.true
    expect(action2.args[0][0])
      .to.have.property('params')
      .that.deep.equals({ one: 'a', two: 'b' })
    expect(result).to.be.true
  })

  it('should override URL parameters with same name in child route', async () => {
    const action1 = sinon.spy()
    const action2 = sinon.spy(() => true)
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
    expect(action1.calledTwice).to.be.true
    expect(action1.args[0][0])
      .to.have.property('params')
      .that.deep.equals({ one: 'a' })
    expect(action1.args[1][0])
      .to.have.property('params')
      .that.deep.equals({ one: 'b' })
    expect(action2.calledOnce).to.be.true
    expect(action2.args[0][0])
      .to.have.property('params')
      .that.deep.equals({ one: 'a', two: 'b' })
    expect(result).to.be.true
  })

  it('should not collect parameters from previous routes', async () => {
    const action1 = sinon.spy(() => undefined)
    const action2 = sinon.spy(() => undefined)
    const action3 = sinon.spy(() => true)
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
    expect(action1.calledTwice).to.be.true
    expect(action1.args[0][0])
      .to.have.property('params')
      .that.deep.equals({ one: 'a' })
    expect(action1.args[1][0])
      .to.have.property('params')
      .that.deep.equals({ one: 'a', two: 'b' })
    expect(action2.calledTwice).to.be.true
    expect(action2.args[0][0])
      .to.have.property('params')
      .that.deep.equals({ three: 'a' })
    expect(action2.args[1][0])
      .to.have.property('params')
      .that.deep.equals({ three: 'a', four: 'b' })
    expect(action3.calledOnce).to.be.true
    expect(action3.args[0][0])
      .to.have.property('params')
      .that.deep.equals({ three: 'a', five: 'b' })
    expect(result).to.be.true
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
    expect(log).to.be.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(result).to.be.equal('done')
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
    expect(log).to.be.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(result).to.be.equal('done')
  })

  it('should support parametrized routes 1', async () => {
    const action = sinon.spy(() => true)
    const router = new UniversalRouter([{ path: '/path/:a/other/:b', action }])
    const result = await router.resolve('/path/1/other/2')
    expect(action.calledOnce).to.be.true
    expect(action.args[0][0]).to.have.nested.property('params.a', '1')
    expect(action.args[0][0]).to.have.nested.property('params.b', '2')
    expect(action.args[0][1]).to.have.property('a', '1')
    expect(action.args[0][1]).to.have.property('b', '2')
    expect(result).to.be.true
  })

  it('should support nested routes (1)', async () => {
    const action1 = sinon.spy()
    const action2 = sinon.spy(() => true)
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
    expect(action1.calledOnce).to.be.true
    expect(action1.args[0][0]).to.have.property('path', '')
    expect(action2.calledOnce).to.be.true
    expect(action2.args[0][0]).to.have.property('path', '/a')
    expect(result).to.be.true
  })

  it('should support nested routes (2)', async () => {
    const action1 = sinon.spy()
    const action2 = sinon.spy(() => true)
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
    expect(action1.calledOnce).to.be.true
    expect(action1.args[0][0]).to.have.property('path', '/a')
    expect(action2.calledOnce).to.be.true
    expect(action2.args[0][0]).to.have.property('path', '/b')
    expect(result).to.be.true
  })

  it('should support nested routes (3)', async () => {
    const action1 = sinon.spy(() => undefined)
    const action2 = sinon.spy(() => null)
    const action3 = sinon.spy(() => true)
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
    expect(action1.calledOnce).to.be.true
    expect(action1.args[0][0]).to.have.property('baseUrl', '')
    expect(action1.args[0][0]).to.have.property('path', '/a')
    expect(action2.calledOnce).to.be.true
    expect(action2.args[0][0]).to.have.property('baseUrl', '/a')
    expect(action2.args[0][0]).to.have.property('path', '/b')
    expect(action3.calledOnce).to.be.true
    expect(action3.args[0][0]).to.have.property('baseUrl', '')
    expect(action3.args[0][0]).to.have.property('path', '/a/b')
    expect(result).to.be.true
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
    expect(err).to.be.equal(error)
  })

  it('should respect baseUrl', async () => {
    const action = sinon.spy(() => 17)
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
    expect(action.calledOnce).to.be.true
    expect(action.args[0][0]).to.have.property('pathname', '/base/a/b/c')
    expect(action.args[0][0]).to.have.property('path', '/c')
    expect(action.args[0][0]).to.have.property('baseUrl', '/base/a/b')
    expect(action.args[0][0]).to.have.property('route', routes.children[0].children[0])
    expect(action.args[0][0]).to.have.property('router', router)
    expect(result).to.be.equal(17)

    let err
    try {
      await router.resolve('/a/b/c')
    } catch (e) {
      err = e
    }
    expect(action.calledOnce).to.be.true
    expect(err).to.be.an('error')
    expect(err.message).to.be.equal('Page not found')
    expect(err.code).to.be.equal(404)
    expect(err.context.pathname).to.be.equal('/a/b/c')
    expect(err.context.path).to.be.equal(undefined)
    expect(err.context.router).to.be.equal(router)
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
    expect(await router.resolve('/')).to.be.equal('a')
    expect(await router.resolve('/page/')).to.be.equal('b')
    expect(await router.resolve('/child/')).to.be.equal('c')
    expect(await router.resolve('/child/page/')).to.be.equal('d')
  })

  it('should skip nested routes when middleware route returns null', async () => {
    const middleware = sinon.spy(() => null)
    const action = sinon.spy(() => 'skipped')
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
    expect(result).to.be.equal(404)
    expect(action.called).to.be.false
    expect(middleware.calledOnce).to.be.true
  })

  it('should match nested routes when middleware route returns undefined', async () => {
    const middleware = sinon.spy(() => undefined)
    const action = sinon.spy(() => null)
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
    expect(result).to.be.equal(404)
    expect(action.calledOnce).to.be.true
    expect(middleware.calledOnce).to.be.true
  })
})
