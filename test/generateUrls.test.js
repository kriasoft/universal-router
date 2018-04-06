/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import UniversalRouter from '../src/UniversalRouter'
import generateUrls from '../src/generateUrls'

describe('generateUrls(router, options)(routeName, params)', () => {
  it('should throw an error in case of invalid router', async () => {
    expect(() => generateUrls()).toThrow(/An instance of UniversalRouter is expected/)
    expect(() => generateUrls([])).toThrow(/An instance of UniversalRouter is expected/)
    expect(() => generateUrls(123)).toThrow(/An instance of UniversalRouter is expected/)
    expect(() => generateUrls(null)).toThrow(/An instance of UniversalRouter is expected/)
    expect(() => generateUrls(UniversalRouter)).toThrow(
      /An instance of UniversalRouter is expected/,
    )
  })

  it('should throw an error if no route found', async () => {
    const router = new UniversalRouter({ path: '/a', name: 'a' })
    const url = generateUrls(router)
    expect(() => url('hello')).toThrow(/Route "hello" not found/)

    router.root.children = [{ path: '/b', name: 'new' }]
    expect(url('new')).toBe('/a/b')
  })

  it('should throw an error if route name is not unique', async () => {
    const router = new UniversalRouter([
      { path: '/a', name: 'example' },
      { path: '/b', name: 'example' },
    ])
    const url = generateUrls(router)
    expect(() => url('example')).toThrow(/Route "example" already exists/)
  })

  it('should generate url for named routes', async () => {
    const router1 = new UniversalRouter({ path: '/:name', name: 'user' })
    const url1 = generateUrls(router1)
    expect(url1('user', { name: 'koistya' })).toBe('/koistya')
    expect(() => url1('user')).toThrow(/Expected "name" to be a string/)

    const router2 = new UniversalRouter({ path: '/user/:id', name: 'user' })
    const url2 = generateUrls(router2)
    expect(url2('user', { id: 123 })).toBe('/user/123')
    expect(() => url2('user')).toThrow(/Expected "id" to be a string/)

    const router3 = new UniversalRouter({ path: '/user/:id' })
    const url3 = generateUrls(router3)
    expect(() => url3('user')).toThrow(/Route "user" not found/)
  })

  it('should generate urls for routes with array of paths', async () => {
    const router1 = new UniversalRouter({ path: ['/:name', '/user/:name'], name: 'user' })
    const url1 = generateUrls(router1)
    expect(url1('user', { name: 'koistya' })).toBe('/koistya')

    const router2 = new UniversalRouter({ path: ['/user/:id', /\/user\/(\d+)/i], name: 'user' })
    const url2 = generateUrls(router2)
    expect(url2('user', { id: 123 })).toBe('/user/123')

    const router3 = new UniversalRouter({ path: [], name: 'user' })
    const url3 = generateUrls(router3)
    expect(url3('user')).toBe('/')
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
    expect(url('a')).toBe('/')
    expect(url('b', { x: 123 })).toBe('/b/123')
    expect(url('c', { x: 'i', y: 'j' })).toBe('/b/i/c/j')
    expect(router.routesByName.get('a')).toBeDefined()
    expect(router.routesByName.get('b')).toBeDefined()
    expect(router.routesByName.get('c')).toBeDefined()
    expect(router.routesByName.get('new')).not.toBeDefined()

    router.root.children.push({ path: '/new', name: 'new' })
    expect(url('new')).toBe('/new')
    expect(router.routesByName.get('a')).toBeDefined()
    expect(router.routesByName.get('b')).toBeDefined()
    expect(router.routesByName.get('c')).toBeDefined()
    expect(router.routesByName.get('new')).toBeDefined()
  })

  it('should respect baseUrl', async () => {
    const options = { baseUrl: '/base' }

    const router1 = new UniversalRouter({ path: '', name: 'home' }, options)
    const url1 = generateUrls(router1)
    expect(url1('home')).toBe('/base')

    const router2 = new UniversalRouter({ path: '/post/:id', name: 'post' }, options)
    const url2 = generateUrls(router2)
    expect(url2('post', { id: 12, x: 'y' })).toBe('/base/post/12')

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
    expect(url3('a')).toBe('/base')
    expect(url3('b')).toBe('/base')
    expect(url3('c', { x: 'x' })).toBe('/base/c/x')
    expect(url3('d', { x: 'x', y: 'y' })).toBe('/base/c/x/d/y')

    router3.root.children.push({ path: '/new', name: 'new' })
    expect(url3('new')).toBe('/base/new')
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
    expect(url('a')).toBe('/')
    expect(url('b')).toBe('/parent/')
    expect(url('c')).toBe('/parent/child/')

    const baseRouter = new UniversalRouter(routes, { baseUrl: '/base' })
    const baseUrl = generateUrls(baseRouter)
    expect(baseUrl('a')).toBe('/base/')
    expect(baseUrl('b')).toBe('/base/parent/')
    expect(baseUrl('c')).toBe('/base/parent/child/')
  })

  it('should encode params', async () => {
    const router = new UniversalRouter({ path: '/:user', name: 'user' })

    const url = generateUrls(router)
    const prettyUrl = generateUrls(router, {
      encode(str, token) {
        expect(token.name).toBe('user')
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

    expect(url('user', { user: '#$&+,/:;=?@' })).toBe('/%23%24%26%2B%2C%2F%3A%3B%3D%3F%40')
    expect(prettyUrl('user', { user: '#$&+,/:;=?@' })).toBe('/%23$&+,%2F:;=%3F@')
  })

  it('should stringify query params (1)', async () => {
    const router = new UniversalRouter({ path: '/:user', name: 'user' })
    const stringifyQueryParams = jest.fn(() => 'qs')

    const url = generateUrls(router, { stringifyQueryParams })

    expect(url('user', { user: 'tj', busy: 1 })).toBe('/tj?qs')
    expect(stringifyQueryParams.mock.calls.length).toBe(1)
    expect(stringifyQueryParams.mock.calls[0][0]).toEqual({ busy: 1 })
  })

  it('should stringify query params (2)', async () => {
    const router = new UniversalRouter({ path: '/user/:username', name: 'user' })
    const stringifyQueryParams = jest.fn(() => '')

    const url = generateUrls(router, { stringifyQueryParams })

    expect(url('user', { username: 'tj', busy: 1 })).toBe('/user/tj')
    expect(stringifyQueryParams.mock.calls.length).toBe(1)
    expect(stringifyQueryParams.mock.calls[0][0]).toEqual({ busy: 1 })
  })

  it('should stringify query params (3)', async () => {
    const router = new UniversalRouter({ path: '/me', name: 'me' })
    const stringifyQueryParams = jest.fn(() => '?x=i&y=j&z=k')

    const url = generateUrls(router, { stringifyQueryParams })

    expect(url('me', { x: 'i', y: 'j', z: 'k' })).toBe('/me?x=i&y=j&z=k')
    expect(stringifyQueryParams.mock.calls.length).toBe(1)
    expect(stringifyQueryParams.mock.calls[0][0]).toEqual({ x: 'i', y: 'j', z: 'k' })
  })
})
