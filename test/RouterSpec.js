/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { describe, it } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import Router from '../src/Router';

describe('Router', () => {
  it('new Router(routes) initializes a router with a list of routes', async () => {
    const action1 = sinon.spy();
    const action2 = sinon.spy();
    const router = new Router([
      { path: '/a', action: action1 },
      { path: '/b', action: action2 },
    ]);

    expect(action1.called).to.be.false;
    expect(action2.called).to.be.false;

    await router.dispatch({ path: '/b' });
    expect(action1.called).to.be.false;
    expect(action2.calledOnce).to.be.true;
    expect(action2.args[0][0]).to.have.property('path', '/b');

    await router.dispatch({ path: '/a' });
    expect(action1.calledOnce).to.be.true;
    expect(action1.args[0][0]).to.have.property('path', '/a');
    expect(action2.calledOnce).to.be.true;
  });

  it('.route(path, ...actions) should be chainable', () => {
    const router = new Router();
    const result = router.route('/', () => {});
    expect(result).to.be.equal(router);
  });

  it('router.dispatch(path) should find and execute the route handler', async () => {
    const action1 = sinon.spy();
    const action2 = sinon.spy();
    const action3 = sinon.spy();
    const router = new Router();
    router.route('/a', action1);
    router.route('/b', action2);
    router.route('/c', action3);

    await router.dispatch('/b');
    expect(action1.called).to.be.false;
    expect(action2.calledOnce).to.be.true;
    expect(action2.args[0][0]).to.have.property('path', '/b');
    expect(action3.called).to.be.false;

    await router.dispatch('/c');
    expect(action1.called).to.be.false;
    expect(action2.calledOnce).to.be.true;
    expect(action3.calledOnce).to.be.true;
    expect(action3.args[0][0]).to.have.property('path', '/c');
  });

  it('router.dispatch({ path }) should find and execute the route handler', async () => {
    const action = sinon.spy();
    const router = new Router();
    router.route('/foo', action);
    await router.dispatch({ path: '/foo' });
    expect(action.calledOnce).to.be.true;
    expect(action.args[0][0]).to.have.property('path', '/foo');
  });

  it('URL parameters are captured and added to context.params', async () => {
    const action = sinon.spy();
    const router = new Router();
    router.route('/:one/:two', action);
    await router.dispatch({ path: '/a/b' });
    expect(action.calledOnce).to.be.true;
    expect(action.args[0][0]).to.have.deep.property('params.one', 'a');
    expect(action.args[0][0]).to.have.deep.property('params.two', 'b');
  });

  it('A route may have multiple actions', async () => {
    const action1 = sinon.spy();
    const action2 = sinon.spy();
    const router = new Router();
    router.route('/test', action1, action2);
    await router.dispatch({ path: '/test' });
    expect(action1.calledOnce).to.be.true;
    expect(action1.args[0][0]).to.have.property('path', '/test');
    expect(action2.calledOnce).to.be.true;
    expect(action2.args[0][0]).to.have.property('path', '/test');
  });

  it('Should execute route actions in the same order they were added', async () => {
    const log = [];
    const router = new Router();
    router.route('/test', async () => { log.push(2); });
    router.route('/test', async () => { log.push(1); }, () => { log.push(3); });
    await router.dispatch('/test');
    expect(log).to.be.deep.equal([2, 1, 3]);
  });

  it('Should return result', async () => {
    const router = new Router(on => {
      on('/test', async ({ next }) => 3 + await next());
      on('/test', async ({ next }) => 2 + await next(), () => 1);
    });
    const result = await router.dispatch('/test');
    expect(result).to.be.equal(6);
  });

  it('Should support async route actions', async () => {
    const log = [];
    const router = new Router();
    router.route('/test', () => new Promise(resolve => {
      setTimeout(() => { log.push(1); resolve(); }, 500);
    }));
    router.route('/test', () => new Promise(resolve => {
      setTimeout(() => { log.push(2); resolve(); }, 100);
    }));
    await router.dispatch('/test');
    expect(log).to.be.deep.equal([1, 2]);
  });

  it('Should support next() withing a single route', async () => {
    const log = [];
    const router = new Router();
    router.route(
      '/test',
      async ({ next }) => {
        log.push(1);
        await next();
        log.push(3);
      },
      () => {
        log.push(2);
      }
    );
    await router.dispatch('/test');
    expect(log).to.be.deep.equal([1, 2, 3]);
  });

  it('Should support next() across multiple routes', async () => {
    const log = [];
    const router = new Router();
    router.route('/test', async ({ next }) => {
      log.push(1);
      await next();
      log.push(3);
    });
    router.route('/test', () => { log.push(2); });
    await router.dispatch('/test');
    expect(log).to.be.deep.equal([1, 2, 3]);
  });

  it('Should dispatch a route and return a result', async () => {
    const a = {};
    const b = {};
    const router = new Router();
    router.route('/a', () => a);
    router.route('/test', () => b);
    const result = await router.dispatch('/test');
    expect(result).to.be.equal(b);
  });

  it('Should support parametrized routes 1', async () => {
    let result;
    const router = new Router();
    router.route('/path/:foo/other/:boo', ({ params }) => {
      result = params;
    });
    await router.dispatch('/path/123/other/456');
    expect(result).to.be.deep.equal({ foo: '123', boo: '456' });
  });

  it('Should support parametrized routes 2', async () => {
    let result;
    const router = new Router();
    router.route('/path/:foo/other/:boo', (_, params) => {
      result = params;
    });
    await router.dispatch('/path/123/other/456');
    expect(result).to.be.deep.equal({ foo: '123', boo: '456' });
  });
});
