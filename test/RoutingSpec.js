/**
 * React Routing | https://www.kriasoft.com/react-routing
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import { describe, it } from 'mocha';
import { expect } from 'chai';
import Router from '../src/Router';

describe('Routing', () => {

  it('Can add routes', () => {
    const router = new Router();
    router.route('/a', () => {});
    router.route('/b', () => {}, () => {});
  });

  it('Can add event listeners', () => {
    const router = new Router();
    router.on('error', () => {});
  })

});
