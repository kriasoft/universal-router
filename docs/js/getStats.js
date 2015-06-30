/**
 * Babel Starter Kit | https://github.com/babel/babel-starter-kit
 * Copyright (c) Konstantin Tarkus <hello@tarkus.me> | The MIT License
 */

/**
 * Loads data asynchronously via JSONP.
 */
const load = (() => {
  let index = 0;
  const timeout = 5000;

  return url => new Promise((resolve, reject) => {
    const callback = '__callback' + index++;
    const timeoutID = window.setTimeout(() => {
      reject(new Error('Request timeout.'));
    }, timeout);

    window[callback] = response => {
      window.clearTimeout(timeoutID);
      resolve(response);
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = url + (url.indexOf('?') === -1 ? '?' : '&') + 'callback=' + callback;
    document.getElementsByTagName('head')[0].appendChild(script);
  });
})();

/**
 * Loads project stats from GitHub.com
 */
const getStats = (() => {
  const key = 'github.repo';
  return async () => {
    const { value, timestamp } = JSON.parse(window.localStorage.getItem(key)) || {};
    if (value && (new Date() - new Date(timestamp)) < 300000 /* 5 min */) {
      return value;
    }
    let response = await load('https://api.github.com/repos/kriasoft/babel-starter-kit');
    if (response.meta.status === 200) {
      const data = {
        value: {
          name: response.data.name,
          owner: response.data.owner.login,
          url: response.data.html_url,
          description: response.data.description,
          createdAt: response.data.created_at,
          updatedAt: response.data.updated_at,
          pushedAt: response.data.pushed_at,
          size: response.data.size,
          forks: response.data.forks,
          stars: response.data.watchers,
          watchers: response.data.subscribers_count,
          openIssues: response.data.open_issues
        },
        timestamp: new Date()
      };
      window.localStorage.setItem(key, JSON.stringify(data));
      return data;
    } else {
      console.log(response);
      throw new Error('Request failed.');
    }
  };
})();

export default getStats;
