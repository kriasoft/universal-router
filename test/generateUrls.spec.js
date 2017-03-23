/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-present Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { expect } from 'chai';
import Router from '../src/Router';
import generateUrls from '../src/generateUrls';

describe('generateUrls(router) => url(routeName, params)', () => {
  it('should throw an error if no route found', async () => {
    const router = new Router({ path: '/a', name: 'a' });
    const url = generateUrls(router);
    expect(() => url('hello')).to.throw(Error, /Route "hello" not found/);

    router.root.children = [{ path: '/b', name: 'new' }];
    expect(url('new')).to.be.equal('/a/b');
  });

  it('should throw an error if route name is not unique', async () => {
    const router = new Router([
      { path: '/a', name: 'example' },
      { path: '/b', name: 'example' },
    ]);
    const url = generateUrls(router);
    expect(() => url('example')).to.throw(Error, /Route "example" already exists/);
  });

  it('should generate url for named routes', async () => {
    const router1 = new Router({ path: '/:name', name: 'user' });
    const url1 = generateUrls(router1);
    expect(url1('user', { name: 'koistya' })).to.be.equal('/koistya');
    expect(() => url1('user')).to.throw(TypeError, /Expected "name" to be defined/);

    const router2 = new Router({ path: '/user/:id', name: 'user' });
    const url2 = generateUrls(router2);
    expect(url2('user', { id: 123 })).to.be.equal('/user/123');
    expect(() => url2('user')).to.throw(TypeError, /Expected "id" to be defined/);

    const router3 = new Router({ path: '/user/:id' });
    const url3 = generateUrls(router3);
    expect(() => url3('user')).to.throw(Error, /Route "user" not found/);
  });

  it('should generate url for nested routes', async () => {
    const router = new Router({
      path: '/',
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
          ],
        },
      ],
    });
    const url = generateUrls(router);
    expect(url('a')).to.be.equal('/');
    expect(url('b', { x: 123 })).to.be.equal('/b/123');
    expect(url('c', { x: 'i', y: 'j' })).to.be.equal('/b/i/c/j');

    router.root.children.push({ path: '/new', name: 'new' });
    expect(url('new')).to.be.equal('/new');
  });

  it('should respect baseUrl', async () => {
    const options = { baseUrl: '/base' };

    const router1 = new Router({ path: '/', name: 'home' }, options);
    const url1 = generateUrls(router1);
    expect(url1('home')).to.be.equal('/base');

    const router2 = new Router({ path: '/post/:id', name: 'post' }, options);
    const url2 = generateUrls(router2);
    expect(url2('post', { id: 12, x: 'y' })).to.be.equal('/base/post/12');

    const router3 = new Router({
      path: '/',
      name: 'a',
      children: [
        {
          path: '/',
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
    }, options);
    const url3 = generateUrls(router3);
    expect(url3('a')).to.be.equal('/base');
    expect(url3('b')).to.be.equal('/base');
    expect(url3('c', { x: 'x' })).to.be.equal('/base/c/x');
    expect(url3('d', { x: 'x', y: 'y' })).to.be.equal('/base/c/x/d/y');

    router3.root.children.push({ path: '/new', name: 'new' });
    expect(url3('new')).to.be.equal('/base/new');
  });
});
