
(function (window, document) {
  'use strict';

  var KEY = 'smartRoom.theme';   // shared by every page; change it here only
  var DEFAULT = 'dark';          // what every page opened as before this file

  function clean(value) {
    return (value === 'light' || value === 'dark') ? value : null;
  }

  /* localStorage is not always available — Safari private mode and some
     file:// sandboxes throw on access rather than returning null. Every
     read and write is guarded, so the worst case is a page that still
     themes correctly but cannot remember the choice. */
  function read() {
    try {
      return clean(window.localStorage.getItem(KEY));
    } catch (e) {
      return null;
    }
  }

  function write(value) {
    try {
      window.localStorage.setItem(KEY, value);
    } catch (e) {
      /* nothing sensible to do; carry on unremembered */
    }
  }

  /* Nothing saved yet means this is a first visit, so open dark — exactly
     what the pages did before. Deliberately NOT following the operating
     system's light/dark setting: that would change how the app looks on a
     machine that has never been asked. */
  var current = read() || DEFAULT;
  var subscribers = [];

  function paintRoot(theme) {
    var root = document.documentElement;
    if (!root) return;
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }

  function announce(theme) {
    for (var i = 0; i < subscribers.length; i++) {
      try {
        subscribers[i](theme);
      } catch (e) {
        /* one broken subscriber must not stop the others */
      }
    }
  }

  paintRoot(current);            // runs while <head> is still parsing

  var Theme = {
    get: function () {
      return current;
    },

    set: function (theme) {
      current = clean(theme) || DEFAULT;
      paintRoot(current);
      write(current);
      announce(current);
      return current;
    },

    toggle: function () {
      return Theme.set(current === 'dark' ? 'light' : 'dark');
    },

    subscribe: function (fn) {
      if (typeof fn !== 'function') return;
      subscribers.push(fn);
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          fn(current);
        });
      } else {
        fn(current);           // DOM already up, no reason to wait
      }
    }
  };

  /* Another tab changed the theme. Follow it, but do not write back —
     that would bounce the value between tabs. Note this event only fires
     in the *other* tabs, never the one that made the change. */
  window.addEventListener('storage', function (event) {
    if (event.key !== KEY) return;
    var incoming = clean(event.newValue);
    if (!incoming || incoming === current) return;
    current = incoming;
    paintRoot(current);
    announce(current);
  });

  window.Theme = Theme;
})(window, document);
