/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-present Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { expect } from 'chai';
import matchPath from '../src/matchPath';

describe('matchPath(routePath, urlPath, end)', () => {
  it('should return null if path not fond (1)', () => {
    const result = matchPath('/', '/a', true);
    expect(result).to.be.null;
  });

  it('should return null if path not fond (2)', () => {
    const result = matchPath('/a', '/', true);
    expect(result).to.be.null;
  });

  it('should return keys and params (1)', () => {
    const result = matchPath('/a', '/a', true);
    expect(result).to.be.deep.equal({ path: '/a', keys: [], params: {} });
  });

  it('should return keys and params (2)', () => {
    const result = matchPath('/:a/:b', '/1/2', true);
    expect(result).to.be.ok;
    expect(result).to.have.property('path', '/1/2');
    expect(result).to.have.property('keys').and.be.an('array').lengthOf(2);
    expect(result).to.have.property('params').and.be.deep.equal({ a: '1', b: '2' });
  });

  it('should return keys and params (3)', () => {
    const result = matchPath('/', '', true);
    expect(result).to.be.ok;
    expect(result).to.have.property('path', '/');
    expect(result).to.have.property('keys').and.be.an('array').lengthOf(0);
    expect(result).to.have.property('params').and.be.an('object');
    expect(Object.keys(result.params)).to.have.lengthOf(0);
  });

  it('should return keys and params (4)', () => {
    const result = matchPath('/:a/:b?', '/1', true);
    expect(result).to.be.ok;
    expect(result).to.have.property('path', '/1');
    expect(result).to.have.property('keys').and.be.an('array').lengthOf(2);
    expect(result).to.have.property('params').and.be.deep.equal({ a: '1', b: undefined });
  });

  it('should return keys and params (5)', () => {
    const result = matchPath('/:a/:b?', '/1/2', true);
    expect(result).to.be.ok;
    expect(result).to.have.property('path', '/1/2');
    expect(result).to.have.property('keys').and.be.an('array').lengthOf(2);
    expect(result).to.have.property('params').and.be.deep.equal({ a: '1', b: '2' });
  });

  it('should return keys and params (6)', () => {
    const result = matchPath('/c', '/c/d', false);
    expect(result).to.be.deep.equal({ path: '/c', keys: [], params: {} });
  });

  it('should return keys and params (7)', () => {
    const result = matchPath('/', '/a/b', false);
    expect(result).to.be.deep.equal({ path: '/', keys: [], params: {} });
  });

  it('should return keys and params (8)', () => {
    const result = matchPath('/', '', false);
    expect(result).to.be.deep.equal({ path: '/', keys: [], params: {} });
  });

  it('should work inside literal parenthesis', () => {
    const result = matchPath('/:user\\(:op\\)', '/tj(edit)', true);
    expect(result).to.be.ok;
    expect(result).to.have.property('path', '/tj(edit)');
    expect(result).to.have.property('keys').and.be.an('array').lengthOf(2);
    expect(result).to.have.property('params').and.be.deep.equal({ user: 'tj', op: 'edit' });
  });

  it('should work following a partial capture group', () => {
    const result1 = matchPath('/user(s)?/:user/:op', '/users/tj/edit', true);
    const result2 = matchPath('/user(s)?/:user/:op', '/user/tj/edit', true);
    expect(result1).to.be.ok;
    expect(result1).to.have.property('keys').and.be.an('array').lengthOf(3);
    expect(result1).to.have.property('params').and.be.deep.equal({ 0: 's', user: 'tj', op: 'edit' });
    expect(result2).to.be.ok;
    expect(result2).to.have.property('keys').and.be.an('array').lengthOf(3);
    expect(result2).to.have.property('params').and.be.deep.equal({ 0: undefined, user: 'tj', op: 'edit' });
  });

  it('should match to an array of paths', () => {
    const result = matchPath(['/e', '/f'], '/f', true);
    expect(result).to.be.deep.equal({ path: '/f', keys: [], params: {} });
  });

  it('should decode params correctly', () => {
    const result = matchPath('/:a/:b/:c', '/%2F/%3A/caf%C3%A9', true);
    expect(result).to.have.property('params').and.be.deep.equal({ a: '/', b: ':', c: 'café' });
  });

  it('should not throw an error for malformed URI params', () => {
    const fn = () => matchPath('/:a', '/%AF', true);
    expect(fn).to.not.throw();
    expect(fn()).to.have.property('params').and.be.deep.equal({ a: '%AF' });
  });
});
