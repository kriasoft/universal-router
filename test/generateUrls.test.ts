/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import UniversalRouter from '../src/UniversalRouter'
import generateUrls, { GenerateUrlsOptions, Params } from '../src/generateUrls'

const router = new UniversalRouter(
  [
    {
      name: 'home',
      path: '',
    },
    {
      name: 'users',
      path: '/users',
    },
    {
      name: 'user',
      path: '/user/:username',
    },
    {
      name: 'post',
      path: '/blog/:category+/:title',
    },
  ],
  { baseUrl: '/base' },
)

const path = generateUrls(router)

path('home') // => '/base'

const options: GenerateUrlsOptions = {
  encode: (value: string) => value,
  stringifyQueryParams(params: Params) {
    return Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join('&')
  },
}

const url = generateUrls(router, options)

url('users') // => '/base/users'
url('user', { username: 'John', busy: 1 }) // => '/base/user/John?busy=1'
url('post', { category: ['a', 'b'], title: 'c' }) // => '/base/blog/a/b/c'
