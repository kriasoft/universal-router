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

  it('should throw an error if no route found', async () => {
    const routes = [];
    let err;
    try {
      await resolve(routes, '/');
    } catch (e) {
      err = e;
    }
    expect(err).to.be.an('error');
    expect(err.message).to.be.equal('Page not found');
    expect(err.status).to.be.equal(404);
    expect(err.statusCode).to.be.equal(404);
  });

  it('should execute the matching route\'s action method and return its result', async () => {
    const action = sinon.spy(() => 'b');
    const route = { path: '/a', action };
    const result = await resolve(route, '/a');
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
    const action = sinon.spy(() => true);
    const routes = [
      { path: '/a', action },
    ];
    const result = await resolve(routes, { path: '/a', test: 'b' });
    expect(action.calledOnce).to.be.true;
    expect(action.args[0][0]).to.have.property('path', '/a');
    expect(action.args[0][0]).to.have.property('test', 'b');
    expect(result).to.be.true;
  });

  it('should not call action methods of routes that don\'t match the URL path', async () => {
    const action = sinon.spy();
    const routes = [
      { path: '/a', action },
    ];
    let err;
    try {
      await resolve(routes, '/b');
    } catch (e) {
      err = e;
    }
    expect(err).to.be.an('error');
    expect(err.message).to.be.equal('Page not found');
    expect(err.status).to.be.equal(404);
    expect(err.statusCode).to.be.equal(404);
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
    const action = sinon.spy(() => true);
    const routes = [
      { path: '/:one/:two', action },
    ];
    const result = await resolve(routes, { path: '/a/b' });
    expect(action.calledOnce).to.be.true;
    expect(action.args[0][0]).to.have.property('params').that.deep.equals({ one: 'a', two: 'b' });
    expect(result).to.be.true;
  });

  it('should provide all URL parameters to each route', async () => {
    const action1 = sinon.spy();
    const action2 = sinon.spy(() => true);
    const routes = [
      {
        path: '/:one',
        action: action1,
        children: [
          {
            path: '/:two',
            action: action2,
          },
        ],
      },
    ];
    const result = await resolve(routes, { path: '/a/b' });
    expect(action1.calledOnce).to.be.true;
    expect(action1.args[0][0]).to.have.property('params').that.deep.equals({ one: 'a' });
    expect(action2.calledOnce).to.be.true;
    expect(action2.args[0][0]).to.have.property('params').that.deep.equals({ one: 'a', two: 'b' });
    expect(result).to.be.true;
  });

  it('should override URL parameters with same name in child route', async () => {
    const action1 = sinon.spy();
    const action2 = sinon.spy(() => true);
    const routes = [
      {
        path: '/:one',
        action: action1,
        children: [
          {
            path: '/:one',
            action: action1,
          },
          {
            path: '/:two',
            action: action2,
          },
        ],
      },
    ];
    const result = await resolve(routes, { path: '/a/b' });
    expect(action1.calledTwice).to.be.true;
    expect(action1.args[0][0]).to.have.property('params').that.deep.equals({ one: 'a' });
    expect(action1.args[1][0]).to.have.property('params').that.deep.equals({ one: 'b' });
    expect(action2.calledOnce).to.be.true;
    expect(action2.args[0][0]).to.have.property('params').that.deep.equals({ one: 'a', two: 'b' });
    expect(result).to.be.true;
  });

  it('should not collect parameters from previous routes', async () => {
    const action1 = sinon.spy(() => undefined);
    const action2 = sinon.spy(() => null);
    const action3 = sinon.spy(() => true);
    const routes = [
      {
        path: '/:one',
        action: action1,
        children: [
          {
            path: '/:two',
            action: action1,
          },
        ],
      },
      {
        path: '/:three',
        action: action2,
        children: [
          {
            path: '/:four',
            action: action2,
          },
          {
            path: '/:five',
            action: action3,
          },
        ],
      },
    ];
    const result = await resolve(routes, { path: '/a/b' });
    expect(action1.calledTwice).to.be.true;
    expect(action1.args[0][0]).to.have.property('params').that.deep.equals({ one: 'a' });
    expect(action1.args[1][0]).to.have.property('params').that.deep.equals({ one: 'a', two: 'b' });
    expect(action2.calledTwice).to.be.true;
    expect(action2.args[0][0]).to.have.property('params').that.deep.equals({ three: 'a' });
    expect(action2.args[1][0]).to.have.property('params').that.deep.equals({ three: 'a', four: 'b' });
    expect(action3.calledOnce).to.be.true;
    expect(action3.args[0][0]).to.have.property('params').that.deep.equals({ three: 'a', five: 'b' });
    expect(result).to.be.true;
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
          const result = await next();
          log.push(5);
          return result;
        },
      },
      { path: '/:id', action() { log.push(3); } },
      { path: '/test', action() { return log.push(4); } },
      { path: '/*', action() { log.push(6); } },
    ];

    const result = await resolve(routes, '/test');
    expect(log).to.be.deep.equal([1, 2, 3, 4, 5]);
    expect(result).to.be.equal(4);
  });

  it('should support parametrized routes 1', async () => {
    const action = sinon.spy(() => true);
    const routes = [
      { path: '/path/:a/other/:b', action },
    ];
    const result = await resolve(routes, '/path/1/other/2');
    expect(action.calledOnce).to.be.true;
    expect(action.args[0][0]).to.have.deep.property('params.a', '1');
    expect(action.args[0][0]).to.have.deep.property('params.b', '2');
    expect(action.args[0][1]).to.have.property('a', '1');
    expect(action.args[0][1]).to.have.property('b', '2');
    expect(result).to.be.true;
  });

  it('should support child routes (1)', async () => {
    const action1 = sinon.spy();
    const action2 = sinon.spy(() => true);
    const routes = [
      {
        path: '/',
        action: action1,
        children: [
          {
            path: '/a',
            action: action2,
          },
        ],
      },
    ];

    const result = await resolve(routes, '/a');
    expect(action1.calledOnce).to.be.true;
    expect(action1.args[0][0]).to.have.property('path', '/');
    expect(action2.calledOnce).to.be.true;
    expect(action2.args[0][0]).to.have.property('path', '/a');
    expect(result).to.be.true;
  });

  it('should support child routes (2)', async () => {
    const action1 = sinon.spy();
    const action2 = sinon.spy(() => true);
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
    ];

    const result = await resolve(routes, '/a/b');
    expect(action1.calledOnce).to.be.true;
    expect(action1.args[0][0]).to.have.property('path', '/a');
    expect(action2.calledOnce).to.be.true;
    expect(action2.args[0][0]).to.have.property('path', '/b');
    expect(result).to.be.true;
  });

  it('should support child routes (3)', async () => {
    const action1 = sinon.spy(() => undefined);
    const action2 = sinon.spy(() => null);
    const action3 = sinon.spy(() => true);
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

    const result = await resolve(routes, '/a/b');
    expect(action1.calledOnce).to.be.true;
    expect(action1.args[0][0]).to.have.property('baseUrl', '');
    expect(action1.args[0][0]).to.have.property('path', '/a');
    expect(action2.calledOnce).to.be.true;
    expect(action2.args[0][0]).to.have.property('baseUrl', '/a');
    expect(action2.args[0][0]).to.have.property('path', '/b');
    expect(action3.calledOnce).to.be.true;
    expect(action3.args[0][0]).to.have.property('baseUrl', '');
    expect(action3.args[0][0]).to.have.property('path', '/a/b');
    expect(result).to.be.true;
  });

  it('should re-throw an error', async () => {
    const error = new Error('test error');
    const routes = [
      {
        path: '/a',
        action() { throw error; },
      },
    ];
    let err;
    try {
      await resolve(routes, '/a');
    } catch (e) {
      err = e;
    }
    expect(err).to.be.equal(error);
  });

  it('should support common action handler for declarative routes', async () => {
    const handler = sinon.spy(context => context.route.component || null);
    const action = sinon.spy();
    const routes = {
      path: '/a',
      action,
      children: [
        { path: '/:b', component: null, action },
        { path: '/c', component: 'c', action },
        { path: '/d', component: 'd', action },
      ],
    };
    const result = await resolve(routes, '/a/c', handler);
    expect(handler.calledThrice).to.be.true;
    expect(action.called).to.be.false;
    expect(result).to.be.equal('c');
  });

});
