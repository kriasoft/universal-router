/**
 * Babel Starter Kit | https://github.com/kriasoft/babel-starter-kit
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import { describe, it } from 'mocha';
import { expect } from 'chai';
import Greeting from '../src/Greeting';

describe('Greeting', () => {

  it('Can say hello', () => {
    const greeting = new Greeting();
    const message = greeting.hello();
    expect(message).to.be.equal('Welcome, Guest!');
  });

});
