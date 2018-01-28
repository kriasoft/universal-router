/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { expect } from 'chai'
import matchPath from '../src/matchPath'

describe('matchPath(route, pathname)', () => {
  it('should return null if path not fond (1)', () => {
    const result = matchPath({ path: '/' }, '/a')
    expect(result).to.be.null
  })

  it('should return null if path not fond (2)', () => {
    const result = matchPath({ path: '/a' }, '/')
    expect(result).to.be.null
  })

  it('should return null if path not fond (3)', () => {
    const result = matchPath({ path: '/' }, '/a')
    expect(result).to.be.deep.equal(null)
  })

  it('should return null if path not fond (4)', () => {
    const result = matchPath({ path: '/a' }, '/a/b')
    expect(result).to.be.deep.equal(null)
  })

  it('should return null if path not fond (5)', () => {
    const result = matchPath({}, '/a')
    expect(result).to.be.deep.equal(null)
  })

  it('should return null if path not fond (6)', () => {
    const result = matchPath({ path: '/' }, '')
    expect(result).to.be.deep.equal(null)
  })

  it('should return null if path not fond (7)', () => {
    const result = matchPath({ path: '/', children: [] }, '')
    expect(result).to.be.deep.equal(null)
  })

  it('should return null if path not fond (8)', () => {
    const result = matchPath({ path: '/:a+' }, '', [], null)
    expect(result).to.be.null
  })

  it('should return keys and params (1)', () => {
    const result = matchPath({ path: '/a' }, '/a', [], { x: 'y' })
    expect(result).to.be.deep.equal({ path: '/a', keys: [], params: { x: 'y' } })
  })

  it('should return keys and params (2)', () => {
    const result = matchPath({ path: '/:a/:b' }, '/1/2', [], null)
    expect(result).to.be.ok
    expect(result).to.have.property('path', '/1/2')
    expect(result)
      .to.have.property('keys')
      .and.be.an('array')
      .lengthOf(2)
    expect(result)
      .to.have.property('params')
      .and.be.deep.equal({ a: '1', b: '2' })
  })

  it('should return keys and params (3)', () => {
    const result = matchPath({ path: '' }, '', [], null)
    expect(result).to.be.ok
    expect(result).to.have.property('path', '')
    expect(result)
      .to.have.property('keys')
      .and.be.an('array')
      .lengthOf(0)
    expect(result)
      .to.have.property('params')
      .and.be.an('object')
    expect(Object.keys(result.params)).to.have.lengthOf(0)
  })

  it('should return keys and params (4)', () => {
    const result = matchPath({ path: '/:a/:b?' }, '/1', ['key'], { x: 'y' })
    expect(result).to.be.ok
    expect(result).to.have.property('path', '/1')
    expect(result)
      .to.have.property('keys')
      .and.be.an('array')
      .lengthOf(3)
    expect(result)
      .to.have.property('params')
      .and.be.deep.equal({ x: 'y', a: '1', b: undefined })
    expect(result.keys[0]).to.be.equal('key')
  })

  it('should return keys and params (5)', () => {
    const result = matchPath({ path: '/:a/:b?' }, '/1/2', [], { a: '0' })
    expect(result).to.be.ok
    expect(result).to.have.property('path', '/1/2')
    expect(result)
      .to.have.property('keys')
      .and.be.an('array')
      .lengthOf(2)
    expect(result)
      .to.have.property('params')
      .and.be.deep.equal({ a: '1', b: '2' })
  })

  it('should return keys and params (6)', () => {
    const result = matchPath({ path: '/c', children: [] }, '/c/d', [])
    expect(result).to.be.deep.equal({ path: '/c', keys: [], params: {} })
  })

  it('should return keys and params (7)', () => {
    const result = matchPath({ path: '/', children: [] }, '/', [])
    expect(result).to.be.deep.equal({ path: '', keys: [], params: {} })
  })

  it('should return keys and params (8)', () => {
    const result = matchPath({ path: '', children: [] }, '', [], {})
    expect(result).to.be.deep.equal({ path: '', keys: [], params: {} })
  })

  it('should work inside literal parenthesis', () => {
    const result = matchPath({ path: '/:user\\(:op\\)' }, '/tj(edit)', [], null)
    expect(result).to.be.ok
    expect(result).to.have.property('path', '/tj(edit)')
    expect(result)
      .to.have.property('keys')
      .and.be.an('array')
      .lengthOf(2)
    expect(result)
      .to.have.property('params')
      .and.be.deep.equal({ user: 'tj', op: 'edit' })
  })

  it('should work following a partial capture group', () => {
    const result1 = matchPath({ path: '/user(s)?/:user/:op' }, '/users/tj/edit', [], null)
    const result2 = matchPath({ path: '/user(s)?/:user/:op' }, '/user/tj/edit', result1.keys, null)
    expect(result1).to.be.ok
    expect(result1)
      .to.have.property('keys')
      .and.be.an('array')
      .lengthOf(3)
    expect(result1)
      .to.have.property('params')
      .and.be.deep.equal({ 0: 's', user: 'tj', op: 'edit' })
    expect(result2).to.be.ok
    expect(result2)
      .to.have.property('keys')
      .and.be.an('array')
      .lengthOf(6)
    expect(result2)
      .to.have.property('params')
      .and.be.deep.equal({ 0: undefined, user: 'tj', op: 'edit' })
  })

  it('should match to an array of paths', () => {
    const result = matchPath({ path: ['/e', '/f'] }, '/f', [], null)
    expect(result).to.be.deep.equal({ path: '/f', keys: [], params: {} })
  })

  it('should decode params correctly', () => {
    const result = matchPath({ path: '/:a/:b/:c' }, '/%2F/%3A/caf%C3%A9', [], null)
    expect(result)
      .to.have.property('params')
      .and.be.deep.equal({ a: '/', b: ':', c: 'café' })
  })

  it('should not throw an error for malformed URI params', () => {
    const fn = () => matchPath({ path: '/:a' }, '/%AF', [], null)
    expect(fn).to.not.throw()
    expect(fn())
      .to.have.property('params')
      .and.be.deep.equal({ a: '%AF' })
  })

  it('should support repeat parameters (1)', () => {
    const fn = () => matchPath({ path: '/:a*' }, '/x/y/z', [], null)
    expect(fn).to.not.throw()
    expect(fn())
      .to.have.property('params')
      .and.be.deep.equal({ a: ['x', 'y', 'z'] })
  })

  it('should support repeat parameters (2)', () => {
    const fn = () => matchPath({ path: '/:a*' }, '/x/y/z', [], null)
    expect(fn).to.not.throw()
    expect(fn())
      .to.have.property('params')
      .and.be.deep.equal({ a: ['x', 'y', 'z'] })
  })

  it('should support repeat parameters (3)', () => {
    const fn = () => matchPath({ path: '/:a*' }, '', [], null)
    expect(fn).to.not.throw()
    expect(fn())
      .to.have.property('params')
      .and.be.deep.equal({ a: [] })
  })

  it('should decode repeat parameters correctly', () => {
    const fn = () => matchPath({ path: '/:a+' }, '/x%2Fy/z/%20/%AF', [], null)
    expect(fn).to.not.throw()
    expect(fn())
      .to.have.property('params')
      .and.be.deep.equal({ a: ['x/y', 'z', ' ', '%AF'] })
  })

  it('should not override existing param with undefined', () => {
    const fn = () => matchPath({ path: ['/a/:c', '/b/:c'] }, '/a/x', [], null)
    expect(fn).to.not.throw()
    expect(fn())
      .to.have.property('params')
      .and.be.deep.equal({ c: 'x' })
  })
})
