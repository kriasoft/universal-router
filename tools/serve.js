/**
 * Babel Starter Kit | https://github.com/kriasoft/babel-starter-kit
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

import gaze from 'gaze';
import browserSync from 'browser-sync';
import fs from './utils/fs';
import compile from './utils/compile';
import { rootDir } from './config';

browserSync({
  notify: false,
  server: {
    baseDir: 'docs',
    startPath: rootDir,
    middleware: [async (req, res, next) => {
      if (req.url.startsWith('/socket.io')) {
        return next();
      }

      if (!req.url.startsWith(rootDir)) {
        let location = rootDir.substr(0, rootDir.length - 1) + req.url;
        console.log(`Redirect from ${req.url} to ${location}`);
        res.writeHead(302, { Location: location });
        return res.end();
      }

      let contents, output;

      try {
        req.url = req.url.substr(rootDir.length - 1);
        let pathname = req.url.indexOf('?') === -1 ?
          req.url : req.url.substr(0, req.url.indexOf('?'));

        if (pathname === '/css/main.min.css') {
          contents = await fs.readFile('./docs/css/main.css');
          output = await compile.css(contents, { map: true });
          res.setHeader('Content-Type', 'text/css');
          res.end(output);
        } else if (pathname === '/js/main.min.js') {
          output = await compile.js({debug: true});
          res.setHeader('Content-Type', 'application/javascript');
          res.end(output);
        } else {
          let filename = pathname === '/' ? './docs/index.md' : './docs' + pathname + '.md';
          let exists = await fs.exists(filename);
          if (!exists) {
            return next();
          }
          contents = await fs.readFile(filename);
          output = await compile.md(contents, {
            root: rootDir,
            url: req.url,
            fileName: filename.substr(1)
          });
          res.end(output);
        }
      } catch (err) {
        next(err);
      }
    }]
  },
  port: process.env.PORT || 3000
});

// Watch for modifications
gaze('docs/**', (err, watcher) => {
  if (err) {
    console.log(err);
  }
  watcher.on('changed', file => {
    if (file.endsWith('.css')) {
      browserSync.reload('css/main.min.css');
    } else if (file.endsWith('.js')) {
      browserSync.reload('js/main.js');
    } else {
      browserSync.reload();
    }
  });
});
