/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { describe, test, expect, vi, type Mock } from 'vitest'
import UniversalRouter from './universal-router'
import UniversalRouterSync from './universal-router-sync'
import generateUrls from './generate-urls'
import { parse } from './path-to-regexp'

describe('generateUrls', () => {
  test('requires router', () => {
    // @ts-expect-error missing argument
    expect(() => generateUrls()).toThrow(/Router is not defined/)
  })

  test('throws when route not found', () => {
    const router = new UniversalRouter({ path: '/a', name: 'a' })
    const url = generateUrls(router)
    expect(() => url('hello')).toThrow(/Route "hello" not found/)

    router.root.children = [{ path: '/b', name: 'new' }]
    expect(url('new')).toBe('/a/b')
  })

  test('throws when route name is not unique', () => {
    const router = new UniversalRouter([
      { path: '/a', name: 'example' },
      { path: '/b', name: 'example' },
    ])
    const url = generateUrls(router)
    expect(() => url('example')).toThrow(/Route "example" already exists/)
  })

  test('generates url for named routes', () => {
    const router1 = new UniversalRouter({ path: '/:name', name: 'user' })
    const url1 = generateUrls(router1)
    expect(url1('user', { name: 'koistya' })).toBe('/koistya')
    expect(() => url1('user')).toThrow(/Missing parameters: name/)

    const router2 = new UniversalRouter({ path: '/user/:id', name: 'user' })
    const url2 = generateUrls(router2)
    expect(url2('user', { id: '123' })).toBe('/user/123')
    expect(() => url2('user')).toThrow(/Missing parameters: id/)

    const router3 = new UniversalRouter({ path: '/user/:id' })
    const url3 = generateUrls(router3)
    expect(() => url3('user')).toThrow(/Route "user" not found/)
  })

  test('generates url for routes with array of paths', () => {
    const router1 = new UniversalRouter({
      path: ['/:name', '/user/:name'],
      name: 'user',
    })
    const url1 = generateUrls(router1)
    expect(url1('user', { name: 'koistya' })).toBe('/koistya')

    const router2 = new UniversalRouter({
      path: ['/user/:id', '/user/(\\d+)'],
      name: 'user',
    })
    const url2 = generateUrls(router2)
    expect(url2('user', { id: '123' })).toBe('/user/123')

    const router3 = new UniversalRouter({ path: [], name: 'user' })
    const url3 = generateUrls(router3)
    expect(url3('user')).toBe('/')
  })

  test('generates url for nested routes', () => {
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
    expect(url('b', { x: '123' })).toBe('/b/123')
    expect(url('c', { x: 'i', y: 'j' })).toBe('/b/i/c/j')

    if (Array.isArray(router.root.children)) {
      router.root.children.push({ path: '/new', name: 'new' })
    }
    expect(url('new')).toBe('/new')
  })

  test('respects baseUrl', () => {
    const options = { baseUrl: '/base' }

    const router1 = new UniversalRouter({ path: '', name: 'home' }, options)
    const url1 = generateUrls(router1)
    expect(url1('home')).toBe('/base')

    const router2 = new UniversalRouter(
      { path: '/post/:id', name: 'post' },
      options,
    )
    const url2 = generateUrls(router2)
    expect(url2('post', { id: '12', x: 'y' })).toBe('/base/post/12')

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

    if (Array.isArray(router3.root.children)) {
      router3.root.children.push({ path: '/new', name: 'new' })
    }
    expect(url3('new')).toBe('/base/new')
  })

  test('generates url with trailing slash', () => {
    const routes = [
      { name: 'a', path: '/' },
      {
        path: '/parent',
        children: [
          { name: 'b', path: '/' },
          { name: 'c', path: '/child/' },
        ],
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

  test('encodes params', () => {
    const router = new UniversalRouter({ path: '/:user', name: 'user' })

    const url = generateUrls(router)
    const prettyUrl = generateUrls(router, {
      encode(str) {
        return encodeURI(str).replace(
          /[/?#]/g,
          (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
        )
      },
    })

    expect(url('user', { user: '#$&+,/:;=?@' })).toBe(
      '/%23%24%26%2B%2C%2F%3A%3B%3D%3F%40',
    )
    expect(prettyUrl('user', { user: '#$&+,/:;=?@' })).toBe(
      '/%23$&+,%2F:;=%3F@',
    )
  })

  test('stringify query params (1)', () => {
    const router = new UniversalRouter({ path: '/:user', name: 'user' })
    const stringifyQueryParams: Mock = vi.fn(() => 'qs')

    const url = generateUrls(router, { stringifyQueryParams })

    expect(url('user', { user: 'tj', busy: '1' })).toBe('/tj?qs')
    expect(stringifyQueryParams.mock.calls.length).toBe(1)
    expect(stringifyQueryParams.mock.calls[0]?.[0]).toEqual({ busy: '1' })
  })

  test('stringify query params (2)', () => {
    const router = new UniversalRouter({
      path: '/user/:username',
      name: 'user',
    })
    const stringifyQueryParams: Mock = vi.fn(() => '')

    const url = generateUrls(router, { stringifyQueryParams })

    expect(url('user', { username: 'tj', busy: '1' })).toBe('/user/tj')
    expect(stringifyQueryParams.mock.calls.length).toBe(1)
    expect(stringifyQueryParams.mock.calls[0]?.[0]).toEqual({ busy: '1' })
  })

  test('stringify query params (3)', () => {
    const router = new UniversalRouter({ path: '/me', name: 'me' })
    const stringifyQueryParams: Mock = vi.fn(() => '?x=i&y=j&z=k')

    const url = generateUrls(router, { stringifyQueryParams })

    expect(url('me', { x: 'i', y: 'j', z: 'k' })).toBe('/me?x=i&y=j&z=k')
    expect(stringifyQueryParams.mock.calls.length).toBe(1)
    expect(stringifyQueryParams.mock.calls[0]?.[0]).toEqual({
      x: 'i',
      y: 'j',
      z: 'k',
    })
  })

  test('compatible with UniversalRouterSync', () => {
    const router = new UniversalRouterSync({ path: '/foo', name: 'bar' })
    const url = generateUrls(router)
    expect(url('bar')).toBe('/foo')
  })

  test('unique nested rout names', () => {
    const router = new UniversalRouter([
      {
        path: '/a',
        name: 'a',
        children: [{ path: '/x', name: 'x' }],
      },
      {
        path: '/b',
        name: 'b',
        children: [
          { path: '/x', name: 'x' },
          { path: '/o', children: [{ path: '/y', name: 'y' }] },
        ],
      },
    ])
    const url = generateUrls(router, { uniqueRouteNameSep: '.' })
    expect(url('a')).toBe('/a')
    expect(url('a.x')).toBe('/a/x')
    expect(url('b')).toBe('/b')
    expect(url('b.x')).toBe('/b/x')
    expect(url('b.y')).toBe('/b/o/y')
  })

  test('uses stringify when path is a TokenData instance', () => {
    const data = parse('/section/:id')
    const router = new UniversalRouter({ path: data, name: 'tokenData' })
    const url = generateUrls(router)
    expect(url('tokenData', { id: '42' })).toBe('/section/42')
  })

  test('handles group tokens (curly-brace groups) in path', () => {
    const router = new UniversalRouter({ path: '/{foo}', name: 'group' })
    const url = generateUrls(router)
    expect(url('group')).toBe('/foo')
  })
})
