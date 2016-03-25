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
import Router from '../src/Router';

function action() {}

describe('Router', () => {
  it('Can initialize an empty router', () => {
    const router = new Router();
    expect(router.routes).to.be.ok.and.of.length(0);
  });

  it('Can add routes', () => {
    const router = new Router()
      .route('/a', action)
      .route('/b', action, action);
    expect(router.routes[0].actions).to.be.ok.and.of.length(1);
    expect(router.routes[0].actions[0]).to.be.equal(action);
    expect(router.routes[1].actions).to.be.ok.and.of.length(2);
    expect(router.routes[1].actions[0]).to.be.equal(action);
  });

  it('Can initialize a router with a list of routes', () => {
    const router = new Router([
      { path: '/a', action },
      { path: '/b', action: [action, action] },
    ]);
    expect(router.routes).to.be.ok.and.of.length(2);
    expect(router.routes[0].actions).to.be.ok.and.of.length(1);
    expect(router.routes[0].actions[0]).to.be.equal(action);
    expect(router.routes[1].actions).to.be.ok.and.of.length(2);
    expect(router.routes[1].actions[0]).to.be.equal(action);
  });

  it('Should execute route actions in the same order they were added', async () => {
    const log = [];
    const router = new Router()
      .route('/test', async () => { log.push(2); })
      .route('/test', async () => { log.push(1); }, () => { log.push(3); });
    await router.dispatch('/test');
    expect(log).to.be.deep.equal([2, 1, 3]);
  });

  it('Should support async route actions', async () => {
    const log = [];
    const router = new Router()
      .route('/test', () => new Promise(resolve => {
        setTimeout(() => { log.push(1); resolve(); }, 500);
      }))
      .route('/test', () => new Promise(resolve => {
        setTimeout(() => { log.push(2); resolve(); }, 100);
      }));
    await router.dispatch('/test');
    expect(log).to.be.deep.equal([1, 2]);
  });

  it('Should support next() withing a single route', async () => {
    const log = [];
    const router = new Router()
      .route(
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
    const router = new Router()
      .route('/test', async ({ next }) => {
        log.push(1);
        await next();
        log.push(3);
      })
      .route('/test', () => { log.push(2); });
    await router.dispatch('/test');
    expect(log).to.be.deep.equal([1, 2, 3]);
  });

  it('Should dispatch a route and return a result', async () => {
    const a = {};
    const b = {};
    const router = new Router()
      .route('/a', () => a)
      .route('/test', () => b);
    const result = await router.dispatch('/test');
    expect(result).to.be.equal(b);
  });

  it('Should support parametrized routes 1', async () => {
    let result;
    const router = new Router()
      .route('/path/:foo/other/:boo', ({ params }) => {
        result = params;
      });
    await router.dispatch('/path/123/other/456');
    expect(result).to.be.deep.equal({ foo: '123', boo: '456' });
  });

  it('Should support parametrized routes 2', async () => {
    let result;
    const router = new Router()
      .route('/path/:foo/other/:boo', (_, params) => {
        result = params;
      });
    await router.dispatch('/path/123/other/456');
    expect(result).to.be.deep.equal({ foo: '123', boo: '456' });
  });
});
