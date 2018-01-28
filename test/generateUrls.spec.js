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
import generateUrls from '../src/generateUrls'

describe('generateUrls(router, options)(routeName, params)', () => {
  it('should throw an error in case of invalid router', async () => {
    expect(() => generateUrls()).to.throw(TypeError, /An instance of UniversalRouter is expected/)
    expect(() => generateUrls([])).to.throw(TypeError, /An instance of UniversalRouter is expected/)
    expect(() => generateUrls(123)).to.throw(
      TypeError,
      /An instance of UniversalRouter is expected/,
    )
    expect(() => generateUrls(null)).to.throw(
      TypeError,
      /An instance of UniversalRouter is expected/,
    )
    expect(() => generateUrls(UniversalRouter)).to.throw(
      TypeError,
      /An instance of UniversalRouter is expected/,
    )
  })

  it('should throw an error if no route found', async () => {
    const router = new UniversalRouter({ path: '/a', name: 'a' })
    const url = generateUrls(router)
    expect(() => url('hello')).to.throw(Error, /Route "hello" not found/)

    router.root.children = [{ path: '/b', name: 'new' }]
    expect(url('new')).to.be.equal('/a/b')
  })

  it('should throw an error if route name is not unique', async () => {
    const router = new UniversalRouter([
      { path: '/a', name: 'example' },
      { path: '/b', name: 'example' },
    ])
    const url = generateUrls(router)
    expect(() => url('example')).to.throw(Error, /Route "example" already exists/)
  })

  it('should generate url for named routes', async () => {
    const router1 = new UniversalRouter({ path: '/:name', name: 'user' })
    const url1 = generateUrls(router1)
    expect(url1('user', { name: 'koistya' })).to.be.equal('/koistya')
    expect(() => url1('user')).to.throw(TypeError, /Expected "name" to be a string/)

    const router2 = new UniversalRouter({ path: '/user/:id', name: 'user' })
    const url2 = generateUrls(router2)
    expect(url2('user', { id: 123 })).to.be.equal('/user/123')
    expect(() => url2('user')).to.throw(TypeError, /Expected "id" to be a string/)

    const router3 = new UniversalRouter({ path: '/user/:id' })
    const url3 = generateUrls(router3)
    expect(() => url3('user')).to.throw(Error, /Route "user" not found/)
  })

  it('should generate urls for routes with array of paths', async () => {
    const router1 = new UniversalRouter({ path: ['/:name', '/user/:name'], name: 'user' })
    const url1 = generateUrls(router1)
    expect(url1('user', { name: 'koistya' })).to.be.equal('/koistya')

    const router2 = new UniversalRouter({ path: ['/user/:id', /\/user\/(\d+)/i], name: 'user' })
    const url2 = generateUrls(router2)
    expect(url2('user', { id: 123 })).to.be.equal('/user/123')

    const router3 = new UniversalRouter({ path: [], name: 'user' })
    const url3 = generateUrls(router3)
    expect(url3('user')).to.be.equal('/')
  })

  it('should generate url for nested routes', async () => {
    const router = new UniversalRouter({
      path: '',
      name: 'a',
      children: [
        {
          path: '/b/:x',
          name: 'b',
          children: [
            {
              path: '/c/:y',
              name: 'c',
            },
            { path: '/d' },
            { path: '/e' },
          ],
        },
      ],
    })
    const url = generateUrls(router)
    expect(url('a')).to.be.equal('/')
    expect(url('b', { x: 123 })).to.be.equal('/b/123')
    expect(url('c', { x: 'i', y: 'j' })).to.be.equal('/b/i/c/j')
    expect(router.routesByName).to.have.all.keys('a', 'b', 'c')

    router.root.children.push({ path: '/new', name: 'new' })
    expect(url('new')).to.be.equal('/new')
    expect(router.routesByName).to.have.all.keys('a', 'b', 'c', 'new')
  })

  it('should respect baseUrl', async () => {
    const options = { baseUrl: '/base' }

    const router1 = new UniversalRouter({ path: '', name: 'home' }, options)
    const url1 = generateUrls(router1)
    expect(url1('home')).to.be.equal('/base')

    const router2 = new UniversalRouter({ path: '/post/:id', name: 'post' }, options)
    const url2 = generateUrls(router2)
    expect(url2('post', { id: 12, x: 'y' })).to.be.equal('/base/post/12')

    const router3 = new UniversalRouter(
      {
        name: 'a',
        children: [
          {
            path: '',
            name: 'b',
          },
          {
            path: '/c/:x',
            name: 'c',
            children: [
              {
                path: '/d/:y',
                name: 'd',
              },
            ],
          },
        ],
      },
      options,
    )
    const url3 = generateUrls(router3)
    expect(url3('a')).to.be.equal('/base')
    expect(url3('b')).to.be.equal('/base')
    expect(url3('c', { x: 'x' })).to.be.equal('/base/c/x')
    expect(url3('d', { x: 'x', y: 'y' })).to.be.equal('/base/c/x/d/y')

    router3.root.children.push({ path: '/new', name: 'new' })
    expect(url3('new')).to.be.equal('/base/new')
  })

  it('should generate url with trailing slash', async () => {
    const routes = [
      { name: 'a', path: '/' },
      {
        path: '/parent',
        children: [{ name: 'b', path: '/' }, { name: 'c', path: '/child/' }],
      },
    ]

    const router = new UniversalRouter(routes)
    const url = generateUrls(router)
    expect(url('a')).to.be.equal('/')
    expect(url('b')).to.be.equal('/parent/')
    expect(url('c')).to.be.equal('/parent/child/')

    const baseRouter = new UniversalRouter(routes, { baseUrl: '/base' })
    const baseUrl = generateUrls(baseRouter)
    expect(baseUrl('a')).to.be.equal('/base/')
    expect(baseUrl('b')).to.be.equal('/base/parent/')
    expect(baseUrl('c')).to.be.equal('/base/parent/child/')
  })

  it('should encode params', async () => {
    const router = new UniversalRouter({ path: '/:user', name: 'user' })

    const url = generateUrls(router)
    const prettyUrl = generateUrls(router, {
      encode(str) {
        return encodeURI(str).replace(
          /[/?#]/g,
          (c) =>
            `%${c
              .charCodeAt(0)
              .toString(16)
              .toUpperCase()}`,
        )
      },
    })

    expect(url('user', { user: '#$&+,/:;=?@' })).to.be.equal('/%23%24%26%2B%2C%2F%3A%3B%3D%3F%40')
    expect(prettyUrl('user', { user: '#$&+,/:;=?@' })).to.be.equal('/%23$&+,%2F:;=%3F@')
  })

  it('should stringify query params (1)', async () => {
    const router = new UniversalRouter({ path: '/:user', name: 'user' })
    const stringifyQueryParams = sinon.spy(() => 'qs')

    const url = generateUrls(router, { stringifyQueryParams })

    expect(url('user', { user: 'tj', busy: 1 })).to.be.equal('/tj?qs')
    expect(stringifyQueryParams.calledOnce).to.be.true
    expect(stringifyQueryParams.args[0][0]).to.be.deep.equal({ busy: 1 })
  })

  it('should stringify query params (2)', async () => {
    const router = new UniversalRouter({ path: '/user/:username', name: 'user' })
    const stringifyQueryParams = sinon.spy(() => '')

    const url = generateUrls(router, { stringifyQueryParams })

    expect(url('user', { username: 'tj', busy: 1 })).to.be.equal('/user/tj')
    expect(stringifyQueryParams.calledOnce).to.be.true
    expect(stringifyQueryParams.args[0][0]).to.be.deep.equal({ busy: 1 })
  })

  it('should stringify query params (3)', async () => {
    const router = new UniversalRouter({ path: '/me', name: 'me' })
    const stringifyQueryParams = sinon.spy(() => '?x=i&y=j&z=k')

    const url = generateUrls(router, { stringifyQueryParams })

    expect(url('me', { x: 'i', y: 'j', z: 'k' })).to.be.equal('/me?x=i&y=j&z=k')
    expect(stringifyQueryParams.calledOnce).to.be.true
    expect(stringifyQueryParams.args[0][0]).to.be.deep.equal({ x: 'i', y: 'j', z: 'k' })
  })
})
