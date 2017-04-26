/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

/**
 * @typedef {object} Build
 * @property {object} css
 * @property {object} html
 * @property {Build.Classes} classes
 * @property {object} selectors
 * @property {Function} mixin
 */

/**
 * @typedef {object} Build.Css
 * @property {object} wrapper
 * @property {object} hint
 * @property {object} input
 * @property {object} inputWithNoHint
 * @property {object} menu
 * @property {object} ltr
 * @property {object} rtl
 */

/**
 * @typedef {object} Build.Classes
 * @property {string} wrapper
 * @property {string} input
 * @property {string} hint
 * @property {string} menu
 * @property {string} dataset
 * @property {string} suggestion
 * @property {string} selectable
 * @property {string} empty
 * @property {string} open
 * @property {string} cursor
 * @property {string} highlight
 */

/**
 * @returns {Build}
 */
var WWW = (function() {
  'use strict';

  var defaultClassNames = {
    wrapper: 'twitter-typeahead',
    input: 'tt-input',
    hint: 'tt-hint',
    menu: 'tt-menu',
    dataset: 'tt-dataset',
    suggestion: 'tt-suggestion',
    selectable: 'tt-selectable',
    empty: 'tt-empty',
    open: 'tt-open',
    cursor: 'tt-cursor',
    highlight: 'tt-highlight'
  };

  return build;

  /**
   * @returns {Build}
   */
  function build(o) {
    var www, classes;

    classes = _.mixin({}, defaultClassNames, o);

    www = {
      css: buildCss(),
      classes: classes,
      html: buildHtml(classes),
      selectors: buildSelectors(classes)
    };

    return {
      css: www.css,
      html: www.html,
      classes: www.classes,
      selectors: www.selectors,
      mixin: function(o) { _.mixin(o, www); }
    };
  }

  function buildHtml(c) {
    return {
      wrapper: '<span class="' + c.wrapper + '"></span>',
      menu: '<div role="listbox" class="' + c.menu + '"></div>'
    };
  }

  function buildSelectors(classes) {
    var selectors = {};
    _.each(classes, function(v, k) { selectors[k] = '.' + v; });

    return selectors;
  }

  function buildCss() {
    var css = {
      wrapper: {
        position: 'relative',
        display: 'inline-block'
      },
      hint: {
        position: 'absolute',
        top: '0',
        left: '0',
        borderColor: 'transparent',
        boxShadow: 'none',
        // #741: fix hint opacity issue on iOS
        opacity: '1'
      },
      input: {
        position: 'relative',
        verticalAlign: 'top',
        backgroundColor: 'transparent'
      },
      inputWithNoHint: {
        position: 'relative',
        verticalAlign: 'top'
      },
      menu: {
        position: 'absolute',
        top: '100%',
        left: '0',
        zIndex: '100',
        display: 'none'
      },
      ltr: {
        left: '0',
        right: 'auto'
      },
      rtl: {
        left: 'auto',
        right: ' 0'
      }
    };

    // ie specific styling
    if (_.isMsie()) {
      // ie6-8 (and 9?) doesn't fire hover and click events for elements with
      // transparent backgrounds, for a workaround, use 1x1 transparent gif
      //noinspection SpellCheckingInspection
      _.mixin(css.input, {
        backgroundImage: 'url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)'
      });
    }

    return css;
  }
})();
