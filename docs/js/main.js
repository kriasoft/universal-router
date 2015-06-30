/**
 * Babel Starter Kit | https://github.com/babel/babel-starter-kit
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import 'babel/polyfill';
import moment from 'moment';
import getStats from './getStats';

const run = async () => {
  try {
    console.log('Welcome to Babel Starter Kit!');
    if (document.querySelector('.stats')) {
      const stats = await getStats();
      if (stats) {
        document.querySelector('.stats-created span').innerText = moment(stats.createdAt).fromNow();
        document.querySelector('.stats-updated span').innerText = moment(stats.updatedAt).fromNow();
        document.querySelector('.stats-forks span').innerText = stats.forks;
        document.querySelector('.stats-stars span').innerText = stats.stars;
        document.querySelector('.stats-watchers span').innerText = stats.watchers;
        document.querySelector('.stats-open-issues span').innerText = stats.openIssues;
      }
    }
  } catch (err) {
    console.log(err);
  }
};

if (window.addEventListener) {
  window.addEventListener('DOMContentLoaded', run);
} else {
  window.attachEvent('onload', run);
}
