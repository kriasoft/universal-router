/**
 * React Routing | https://www.kriasoft.com/react-routing
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import 'babel/polyfill';
import getStats from './getStats';

const run = async () => {
  try {
    console.log('Welcome to Babel Starter Kit!');
    const stats = await getStats();
    console.log(stats);
  } catch (err) {
    console.log(err);
  }
};

if (window.addEventListener) {
  window.addEventListener('DOMContentLoaded', run);
} else {
  window.attachEvent('onload', run);
}
