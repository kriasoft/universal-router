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
import React from 'react/addons';
import Router from '../src/Router';

const TestUtils = React.addons.TestUtils;

describe('Routing', () => {

  it('Can initialize a router with basic routes', () => {
    const handler = () => {};
    const router = new Router(on => {
      on('/a', handler);
      on('/b', handler, handler);
      on('error', handler);
    });
    expect(router.routes).to.be.ok.and.of.length(2);
    expect(router.routes[0].handlers).to.be.ok.and.of.length(1);
    expect(router.routes[0].handlers[0]).to.be.equal(handler);
    expect(router.routes[1].handlers).to.be.ok.and.of.length(2);
    expect(router.routes[1].handlers[0]).to.be.equal(handler);
    expect(router.events.error).to.be.equal(handler);
  });

  it('Should execute route handlers in the same order they were added', async () => {
    const log = [];
    const router = new Router(on => {
      on('/test', async () => { log.push(3); });
      on('/test', async () => { log.push(2); }, () => { log.push(1); });
    });
    await router.dispatch('/test');
    expect(log).to.be.deep.equal([3, 2, 1]);
  });

  it('Should support async route handlers', async () => {
    const log = [];
    const router = new Router(on => {
      on('/test', async () => { log.push(1); });
      on('/test', async () => { log.push(2); });
    });
    await router.dispatch('/test');
    expect(log).to.be.deep.equal([1, 2]);
  });

  it('Should support next() withing a single route', async () => {
    const log = [];
    const router = new Router(on => {
      on('/test', async (state, next) => {
        log.push(1);
        let temp = await (await next());
        log.push(3);
      }, () => {
        log.push(2);
      });
    });
    await router.dispatch('/test');
    expect(log).to.be.deep.equal([1, 2, 3]);
  });

  it('Should support next() across multiple routes', async () => {
    const log = [];
    const router = new Router(on => {
      on('/test', async (state, next) => {
        log.push(1);
        await next();
        log.push(3)
      });
      on('/test', () => { log.push(2); });
    });
    await router.dispatch('/test');
    expect(log).to.be.deep.equal([1, 2, 3]);
  });

  it('Should dispatch a route and return a component to render', async () => {
    const component = <div>Test</div>;
    const router = new Router(on => {
      on('/a', () => <p>Test</p>);
      on('/test', () => component);
    });
    await router.dispatch('/test', (state, result) => {
      expect(result).to.be.equal(component);
    });
  });

  it('Should support parametrized routes', async () => {
    const router = new Router(on => {
      on('/path/:foo/other/:boo', (state) => {
        expect(state.params).to.be.deep.equal({ foo: '123', boo: '456' });
      });
    });
    await router.dispatch('/path/123/other/456');
  });

  it('test', async () => {
    const renderer = TestUtils.createRenderer();
    const router = new Router(on => {
      on('/', {start: true}, async () => {
        "use strict";

      });
    });
  })

});
