/**
 * Babel Starter Kit | https://github.com/babel/babel-starter-kit
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import 'babel/polyfill';
import moment from 'moment';
import onStats from './onStats';

const run = async () => {
  try {
    console.log('Welcome to Babel Starter Kit!');
    if (document.querySelector('.stats')) {
      onStats(stats => {
        document.querySelector('.stats-created span').innerText = moment(stats.createdAt).fromNow();
        document.querySelector('.stats-updated span').innerText = moment(stats.updatedAt).fromNow();
        document.querySelector('.stats-forks span').innerText = stats.forks;
        document.querySelector('.stats-stars span').innerText = stats.watchers;
        document.querySelector('.stats-subscribers span').innerText = stats.subscribers;
        document.querySelector('.stats-open-issues span').innerText = stats.openIssues;
      });
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
