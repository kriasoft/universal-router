/**
 * Babel Starter Kit | https://github.com/babel/babel-starter-kit
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

const run = () => {
  console.log('Welcome to Babel Starter Kit!');
};

if (window.addEventListener) {
  window.addEventListener('DOMContentLoaded', run);
} else {
  window.attachEvent('onload', run);
}
