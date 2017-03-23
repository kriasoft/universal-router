/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { expect } from 'chai';
import { href } from '../src/main';

const emptyRoutes = [];
const simpleRoutes = [{ name: 'root', path: '/', children: [{ name: 'a', path: '/a' }] }];
const nestRoutes = [{
  name: 'root',
  path: '/',
  children: [
    { name: 'a', path: '/a/:a' },
    { name: 'b', path: '/b/:b?' },
    {
      name: 'c',
      path: '/c/:c(\\d+)?',
      children: [
        {
          name: 'd',
          path: '/d',
          children: [
            { name: 'f', path: '/f/:f' },
          ],
        },
      ],
    },
    { name: 'a', path: '/never-mounted-by-name' },
  ],
}];

describe('href(routes, routeName, routeParams, [options = { pretty: false }])', () => {

  it('should return false if no route found', async () => {
    let path;

    path = href(emptyRoutes, 'z');
    expect(path).to.be.null;

    path = href(simpleRoutes, 'z');
    expect(path).to.be.null;

    path = href(nestRoutes, 'z');
    expect(path).to.be.null;
  });

  it('should find and mount the first route by name', () => {
    let path;

    path = href(simpleRoutes, 'root');
    expect(path).to.be.equal('/');

    path = href(nestRoutes, 'root');
    expect(path).to.be.equal('/');

    path = href(nestRoutes, 'a', { a: 'a' });
    expect(path).to.be.equal('/a/a');

    path = href(nestRoutes, 'b');
    expect(path).to.be.equal('/b');

    path = href(nestRoutes, 'b', { b: 'b' });
    expect(path).to.be.equal('/b/b');

    path = href(nestRoutes, 'c');
    expect(path).to.be.equal('/c');

    path = href(nestRoutes, 'c', { c: '1' });
    expect(path).to.be.equal('/c/1');

    path = href(nestRoutes, 'd');
    expect(path).to.be.equal('/c/d');

    path = href(nestRoutes, 'd', { c: '1' });
    expect(path).to.be.equal('/c/1/d');

    path = href(nestRoutes, 'f', { f: 'f' });
    expect(path).to.be.equal('/c/d/f/f');

    path = href(nestRoutes, 'f', { c: '1', f: 'f' });
    expect(path).to.be.equal('/c/1/d/f/f');
  });

});
