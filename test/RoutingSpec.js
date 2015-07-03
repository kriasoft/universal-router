/**
 * React Routing | https://www.kriasoft.com/react-routing
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import { describe, it } from 'mocha';
import { expect } from 'chai';
import Router from '../src/Router';

describe('Routing', () => {

  it('Can add routes', () => {
    const router = new Router(on => {
      on('/a', () => {});
      on('/b', () => {}, () => {});
    });
    expect(router.routes).to.be.ok.and.of.length(2);
    expect(router.routes[0].handlers).to.be.ok.and.of.length(1);
    expect(router.routes[1].handlers).to.be.ok.and.of.length(2);
  });

  it('Can add event listeners', () => {
    const handler = () => {};
    const router = new Router(on => {
      on('error', handler);
    });
    expect(router.events.error).to.be.equal(handler);
  });

});
