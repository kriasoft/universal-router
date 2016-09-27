/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import sinon from 'sinon';
import { expect } from 'chai';
import { resolve } from '../src/main';

describe('resolve(routes, { path, ...context })', () => {

  it('should return null if a route wasn\'t not found', async () => {
    const routes = [];
    const result = await resolve(routes, '/');
    expect(result).to.be.null;
  });

  it('should execute the matching route\'s action method and return its result', async () => {
    const action = sinon.spy(() => 'b');
    const routes = [
      { path: '/a', action },
    ];
    const result = await resolve(routes, '/a');
    expect(action.calledOnce).to.be.true;
    expect(action.args[0][0]).to.have.property('path', '/a');
    expect(result).to.be.equal('b');
  });

  it('should find the first route whose action method !== undefined or null', async () => {
    const action1 = sinon.spy(() => undefined);
    const action2 = sinon.spy(() => null);
    const action3 = sinon.spy(() => 'c');
    const action4 = sinon.spy(() => 'd');
    const routes = [
      { path: '/a', action: action1 },
      { path: '/a', action: action2 },
      { path: '/a', action: action3 },
      { path: '/a', action: action4 },
    ];
    const result = await resolve(routes, '/a');
    expect(result).to.be.equal('c');
    expect(action1.calledOnce).to.be.true;
    expect(action2.calledOnce).to.be.true;
    expect(action3.calledOnce).to.be.true;
    expect(action4.called).to.be.false;
  });

  it('should be able to pass context variables to action methods', async () => {
    const action = sinon.spy();
    const routes = [
      { path: '/a', action },
    ];
    await resolve(routes, { path: '/a', test: 'b' });
    expect(action.calledOnce).to.be.true;
    expect(action.args[0][0]).to.have.property('path', '/a');
    expect(action.args[0][0]).to.have.property('test', 'b');
  });

  it('should not call action methods of routes that don\'t match the URL path', async () => {
    const action = sinon.spy();
    const routes = [
      { path: '/a', action },
    ];
    await resolve(routes, '/b');
    expect(action.called).to.be.false;
  });

  it('should asynchronous route actions', async () => {
    const routes = [
      { path: '/a', action: async () => 'b' },
    ];
    const result = await resolve(routes, '/a');
    expect(result).to.be.equal('b');
  });

  it('URL parameters are captured and added to context.params', async () => {
    const action = sinon.spy();
    const routes = [
      { path: '/:one/:two', action },
    ];
    await resolve(routes, { path: '/a/b' });
    expect(action.calledOnce).to.be.true;
    expect(action.args[0][0]).to.have.deep.property('params.one', 'a');
    expect(action.args[0][0]).to.have.deep.property('params.two', 'b');
  });

  it('should support next() across multiple routes', async () => {
    const log = [];
    const routes = [
      {
        path: '/test',
        children: [
          { path: '/', action() { log.push(2); } },
        ],
        async action({ next }) {
          log.push(1);
          await next();
          log.push(5);
        },
      },
      { path: '/:id', action() { log.push(3); } },
      { path: '/test', action() { return log.push(4); } },
      { path: '/*', action() { log.push(6); } },
    ];

    await resolve(routes, '/test');
    expect(log).to.be.deep.equal([1, 2, 3, 4, 5]);
  });

  it('should support parametrized routes 1', async () => {
    const action = sinon.spy();
    const routes = [
      { path: '/path/:a/other/:b', action },
    ];
    await resolve(routes, '/path/1/other/2');
    expect(action.calledOnce).to.be.true;
    expect(action.args[0][0]).to.have.deep.property('params.a', '1');
    expect(action.args[0][0]).to.have.deep.property('params.b', '2');
    expect(action.args[0][1]).to.have.property('a', '1');
    expect(action.args[0][1]).to.have.property('b', '2');
  });

  it('should support child routes (1)', async () => {
    const action = sinon.spy();
    const routes = [
      {
        path: '/',
        action,
        children: [
          {
            path: '/a',
            action,
          },
        ],
      },
    ];

    await resolve(routes, '/a');
    expect(action.calledTwice).to.be.true;
    expect(action.args[0][0]).to.have.property('path', '/');
    expect(action.args[1][0]).to.have.property('path', '/a');
  });

  it('should support child routes (2)', async () => {
    const action = sinon.spy();
    const routes = [
      {
        path: '/a',
        action,
        children: [
          {
            path: '/b',
            action,
          },
        ],
      },
    ];

    await resolve(routes, '/a/b');
    expect(action.calledTwice).to.be.true;
    expect(action.args[0][0]).to.have.property('path', '/a');
    expect(action.args[1][0]).to.have.property('path', '/b');
  });

  it('should support child routes (3)', async () => {
    const action1 = sinon.spy(() => undefined);
    const action2 = sinon.spy(() => undefined);
    const action3 = sinon.spy(() => undefined);
    const routes = [
      {
        path: '/a',
        action: action1,
        children: [
          {
            path: '/b',
            action: action2,
          },
        ],
      },
      {
        path: '/a/b',
        action: action3,
      },
    ];

    await resolve(routes, '/a/b');
    expect(action1.calledOnce).to.be.true;
    expect(action1.args[0][0]).to.have.property('baseUrl', '');
    expect(action1.args[0][0]).to.have.property('path', '/a');
    expect(action2.calledOnce).to.be.true;
    expect(action2.args[0][0]).to.have.property('baseUrl', '/a');
    expect(action2.args[0][0]).to.have.property('path', '/b');
    expect(action3.calledOnce).to.be.true;
    expect(action3.args[0][0]).to.have.property('baseUrl', '');
    expect(action3.args[0][0]).to.have.property('path', '/a/b');
  });

  it('should re-throw an error', async () => {
    const error = new Error('test error');
    const routes = [
      {
        path: '/a',
        action() { throw error; },
      },
    ];

    try {
      await resolve(routes, '/a');
      return Promise.reject();
    } catch (err) {
      expect(err).to.be.equal(error);
      return Promise.resolve();
    }
  });

  it('should redirect to an error page if it exists', async () => {
    const error = new Error('test error');
    const action = sinon.spy(() => 'b');
    const routes = [
      {
        path: '/a',
        action() { throw error; },
      },
      {
        path: '/error',
        action,
      },
    ];

    const result = await resolve(routes, '/a');
    expect(result).to.be.equal('b');
    expect(action.args[0][0]).to.have.property('error', error);
    expect(action.args[0][0]).to.have.deep.property('error.status', 500);
  });

});
