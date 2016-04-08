/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { expect } from 'chai';
import matchRoute from '../src/matchRoute';

describe('matchRoute(route, baseUrl, path)', () => {

  it('should match 0 routes (1)', () => {
    const route = {
      path: '/',
    };
    const result = Array.from(matchRoute(route, '', '/a'));
    expect(result).to.have.lengthOf(0);
  });

  it('should match 0 routes (2)', () => {
    const route = {
      path: '/a',
    };
    const result = Array.from(matchRoute(route, '', '/b'));
    expect(result).to.have.lengthOf(0);
  });

  it('should match 1 route (1)', () => {
    const route = {
      path: '/',
    };
    const result = Array.from(matchRoute(route, '', '/'));
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.have.property('baseUrl', '');
    expect(result[0]).to.have.property('path', '/');
    expect(result[0]).to.have.deep.property('route.path', '/');
  });

  it('should match 1 route (2)', () => {
    const route = {
      path: '/a',
    };
    const result = Array.from(matchRoute(route, '', '/a'));
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.have.property('baseUrl', '');
    expect(result[0]).to.have.property('path', '/a');
    expect(result[0]).to.have.deep.property('route.path', '/a');
  });

  it('should match 2 routes (1)', () => {
    const route = {
      path: '/',
      children: [
        {
          path: '/a',
        },
      ],
    };
    const result = Array.from(matchRoute(route, '', '/a'));
    expect(result).to.have.lengthOf(2);
    expect(result[0]).to.have.property('baseUrl', '');
    expect(result[0]).to.have.property('path', '/');
    expect(result[0]).to.have.deep.property('route.path', '/');
    expect(result[1]).to.have.property('baseUrl', '');
    expect(result[1]).to.have.property('path', '/a');
    expect(result[1]).to.have.deep.property('route.path', '/a');
  });

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
    };
    const result = Array.from(matchRoute(route, '', '/a/b/c'));
    expect(result).to.have.lengthOf(3);
    expect(result[0]).to.have.property('baseUrl', '');
    expect(result[0]).to.have.deep.property('route.path', '/a');
    expect(result[1]).to.have.property('baseUrl', '/a');
    expect(result[1]).to.have.deep.property('route.path', '/b');
    expect(result[2]).to.have.property('baseUrl', '/a/b');
    expect(result[2]).to.have.deep.property('route.path', '/c');
  });

  it('should match 2 routes (3)', () => {
    const route = {
      path: '/',
      children: [
        {
          path: '/',
        },
      ],
    };
    const result = Array.from(matchRoute(route, '', '/'));
    expect(result).to.have.lengthOf(2);
    expect(result[0]).to.have.property('baseUrl', '');
    expect(result[0]).to.have.deep.property('route.path', '/');
    expect(result[1]).to.have.property('baseUrl', '');
    expect(result[1]).to.have.deep.property('route.path', '/');
  });

});
