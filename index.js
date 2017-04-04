'use strict';

const qs = require('querystring');

let count = 0;

function noop() { }

module.exports = function (url, opts, fn){
  opts = opts || {};

  const prefix = opts.prefix || '__jp';

  // use the callback name that was passed if one was provided.
  // otherwise generate a unique name by incrementing our counter.
  const id = opts.name || (prefix + (count++));

  const callbackField = opts.callbackField || 'callback';
  const timeout = null !== opts.timeout ? opts.timeout : 60000;

  const target = document.getElementsByTagName('script')[0] || document.head;

  let script, timer;

  function cleanup(){
    if (script.parentNode) script.parentNode.removeChild(script);
    window[id] = noop;
    if (timer) clearTimeout(timer);
  }

  // add qs component
  const params = opts.params || {};
  params[callbackField] = id;
  url += `${~url.indexOf('?') ? '&' : '?'}${qs.encode(params)}`;
  url = url.replace('?&', '?');

  return new Promise((resolve, reject) => {
    if (timeout) {
      timer = setTimeout(function() {
        reject('Timeout');
        cleanup();
        fn && fn(new Error('Timeout'));
      }, timeout);
    }

    window[id] = function(data){
      resolve(data);
      cleanup();
      fn && fn(null, data);
    };

    // create script
    script = document.createElement('script');
    script.src = url;
    target.parentNode.insertBefore(script, target);
  });
};