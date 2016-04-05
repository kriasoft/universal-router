/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { expect } from 'chai';
import { matchPath, matchBasePath } from '../src/matchPath';

describe('matchPath(routePath, urlPath)', () => {

  it('should return null if path not fond (1)', () => {
    const result = matchPath('/', '/a');
    expect(result).to.be.null;
  });

  it('should return null if path not fond (2)', () => {
    const result = matchPath('/a', '/');
    expect(result).to.be.null;
  });

  it('should return keys and params (1)', () => {
    const result = matchPath('/a', '/a');
    expect(result).to.be.deep.equal({ path: '/a', keys: [], params: {} });
  });

  it('should return keys and params (2)', () => {
    const result = matchPath('/:a/:b', '/1/2');
    expect(result).to.be.ok;
    expect(result).to.have.property('path', '/1/2');
    expect(result).to.have.property('keys').and.be.an('array').lengthOf(2);
    expect(result).to.have.property('params').and.be.deep.equal({ a: '1', b: '2' });
  });

  it('should return keys and params (3)', () => {
    const result = matchPath('/', '');
    expect(result).to.be.ok;
    expect(result).to.have.property('path', '/');
    expect(result).to.have.property('keys').and.be.an('array').lengthOf(0);
    expect(result).to.have.property('params').and.be.an('object');
    expect(Object.keys(result.params)).to.have.lengthOf(0);
  });

  it('should match to an array of paths', () => {
    const result = matchPath(['/e', '/f'], '/f');
    expect(result).to.be.deep.equal({ path: '/f', keys: [], params: {} });
  });

});

describe('matchBasePath(routePath, urlPath)', () => {

  it('should return keys and params (4)', () => {
    const result = matchBasePath('/c', '/c/d');
    expect(result).to.be.deep.equal({ path: '/c', keys: [], params: {} });
  });

  it('should return keys and params (5)', () => {
    const result = matchBasePath('/', '/a/b');
    expect(result).to.be.deep.equal({ path: '/', keys: [], params: {} });
  });

  it('should return keys and params (6)', () => {
    const result = matchBasePath('/', '');
    expect(result).to.be.deep.equal({ path: '/', keys: [], params: {} });
  });

});
