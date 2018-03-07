/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import matchRoute from '../src/matchRoute'

function toArray(gen) {
  const arr = []
  let res = gen.next()
  while (!res.done) {
    arr.push(res.value)
    res = gen.next()
  }
  return arr
}

describe('matchRoute(route, baseUrl, pathname)', () => {
  it('should match 0 routes (1)', () => {
    const route = {
      path: '/',
    }
    const result = toArray(matchRoute(route, '', '/a'))
    expect(result).toHaveLength(0)
  })

  it('should match 0 routes (2)', () => {
    const route = {
      path: '/a',
    }
    const result = toArray(matchRoute(route, '', '/b'))
    expect(result).toHaveLength(0)
  })

  it('should match 0 routes (3)', () => {
    const route = {
      path: '/a',
      children: [
        {
          path: '/b',
        },
      ],
    }
    const result = toArray(matchRoute(route, '', '/b'))
    expect(result).toHaveLength(0)
  })

  it('should match 0 routes (4)', () => {
    const route = {
      path: 'a',
      children: [
        {
          path: 'b',
        },
      ],
    }
    const result = toArray(matchRoute(route, '', 'ab'))
    expect(result).toHaveLength(0)
  })

  it('should match 1 route (1)', () => {
    const route = {
      path: '/',
    }
    const result = toArray(matchRoute(route, '', '/', []))
    expect(result).toHaveLength(1)
    expect(result[0]).toHaveProperty('baseUrl', '')
    expect(result[0]).toHaveProperty('path', '/')
    expect(result[0]).toHaveProperty('route.path', '/')
  })

  it('should match 1 route (2)', () => {
    const route = {
      path: '/a',
    }
    const result = toArray(matchRoute(route, '', '/a', []))
    expect(result).toHaveLength(1)
    expect(result[0]).toHaveProperty('baseUrl', '')
    expect(result[0]).toHaveProperty('path', '/a')
    expect(result[0]).toHaveProperty('route.path', '/a')
  })

  it('should match 2 routes (1)', () => {
    const route = {
      path: '',
      children: [
        {
          path: '/a',
        },
      ],
    }
    const result = toArray(matchRoute(route, '', '/a', []))
    expect(result).toHaveLength(2)
    expect(result[0]).toHaveProperty('baseUrl', '')
    expect(result[0]).toHaveProperty('path', '')
    expect(result[0]).toHaveProperty('route.path', '')
    expect(result[1]).toHaveProperty('baseUrl', '')
    expect(result[1]).toHaveProperty('path', '/a')
    expect(result[1]).toHaveProperty('route.path', '/a')
  })

  it('should match 2 routes (2)', () => {
    const route = {
      path: '/a',
      children: [
        {
          path: '/b',
          children: [
            {
              path: '/c',
            },
          ],
        },
      ],
    }
    const result = toArray(matchRoute(route, '', '/a/b/c', []))
    expect(result).toHaveLength(3)
    expect(result[0]).toHaveProperty('baseUrl', '')
    expect(result[0]).toHaveProperty('route.path', '/a')
    expect(result[1]).toHaveProperty('baseUrl', '/a')
    expect(result[1]).toHaveProperty('route.path', '/b')
    expect(result[2]).toHaveProperty('baseUrl', '/a/b')
    expect(result[2]).toHaveProperty('route.path', '/c')
  })

  it('should match 2 routes (3)', () => {
    const route = {
      path: '',
      children: [
        {
          path: '',
        },
      ],
    }
    const result = toArray(matchRoute(route, '', '/', []))
    expect(result).toHaveLength(2)
    expect(result[0]).toHaveProperty('baseUrl', '')
    expect(result[0]).toHaveProperty('route.path', '')
    expect(result[1]).toHaveProperty('baseUrl', '')
    expect(result[1]).toHaveProperty('route.path', '')
  })
})
