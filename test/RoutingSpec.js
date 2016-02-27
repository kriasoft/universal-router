/**
 * React Routing | http://www.kriasoft.com/react-routing
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
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
      on('c', '/c', handler);
      on('d', '/d', handler);
      on('d', '/d', handler, handler); // Overwrite
      on('error', handler);
    });
    expect(router.routes).to.be.ok.and.of.length(4);
    expect(router.routes[0].handlers).to.be.ok.and.of.length(1);
    expect(router.routes[0].handlers[0]).to.be.equal(handler);
    expect(router.routes[1].handlers).to.be.ok.and.of.length(2);
    expect(router.routes[1].handlers[0]).to.be.equal(handler);
    expect(router.routes[2].handlers).to.be.ok.and.of.length(1);
    expect(router.routes[2].handlers[0]).to.be.equal(handler);
    expect(router.routes[3].handlers).to.be.ok.and.of.length(2);
    expect(router.routes[3].handlers[0]).to.be.equal(handler);
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

  it('Should generate paths', async () => {
    const handler = () => {};
    const router = new Router(on => {
      on('a', '/a', handler);
      on('path', '/path/:foo/other/:boo', handler);
      on('onHandler', '/foo/:bar', () => {
        expect(router.generate('onHandler', { bar: 'bar' })).to.be.equal('/foo/bar');
      });
    });
    await router.dispatch('/foo/bar');
    expect(router.generate('a')).to.be.equal('/a');
    expect(router.generate('path', { foo: 'foo', boo: 'boo' })).to.be.equal('/path/foo/other/boo');
  });

  it('test', async () => {
    const renderer = TestUtils.createRenderer();
    const router = new Router(on => {
      on('/', {start: true}, async () => {
        "use strict";

      });
    });
  });

});
