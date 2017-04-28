/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

/**
 * @class {Input}
 * @mixes {EventEmitter}
 * @mixes {Build}
 */
var Input = (function() {
  'use strict';

  // region constructor

  function Input(o, www) {
    o = o || {};

    if (!o.input) {
      $.error('input is missing');
    }

    www.mixin(this);

    this.$hint = $(o.hint);
    this.$input = $(o.input);

    this.$input.attr({
      'aria-activedescendant': '',
      'aria-owns': this.$input.attr('id') + '_listbox',
      role: 'combobox',
      'aria-readonly': 'true',
      'aria-autocomplete': 'list'
    });

    $(www.menu).attr('id', this.$input.attr('id') + '_listbox');

    // the query defaults to whatever the value of the input is
    // on initialization, it'll most likely be an empty string
    this.query = this.$input.val();

    // for tracking when a change event should be triggered
    this.queryWhenFocused = this.hasFocus() ? this.query : null;

    // helps with calculating the width of the input's value
    this.$overflowHelper = buildOverflowHelper(this.$input);

    // detect the initial lang direction
    this._checkLanguageDirection();

    // if no hint, noop all the hint related functions
    if (this.$hint.length === 0) {
      this.setHint =
        this.getHint =
          this.clearHint =
            this.clearHintIfInvalid = _.noop;
    }

    this.onSync('cursorchange', this._updateDescendent);
  }

  // endregion

  // region static methods

  Input.normalizeQuery = function(str) {
    // strips leading whitespace and condenses all whitespace
    return (_.toStr(str)).replace(/^\s*/g, '').replace(/\s{2,}/g, ' ');
  };

  // endregion

  // region instance methods

  /**
   * @mixin {Input.prototype}
   */
  _.mixin(Input.prototype, EventEmitter, {
    // region ### event handlers

    _onBlur: function _onBlur() {
      this.trigger('blurred');
    },

    _onFocus: function _onFocus() {
      this.queryWhenFocused = this.query;
      this.trigger('focused');
    },

    _onKeydown: function _onKeydown($e) {
      // which is normalized and consistent (but not for ie)
      var key = $e.which || $e.keyCode;
      var actions = [];

      switch (key) {
        case 9:
          actions.push('open');
          $e.shiftKey ? actions.push('moveUp') : actions.push('moveDown');
          break;
        case 13:
          actions.push('select');
          break;
        case 27:
          actions.push('close');
          break;
        case 32:
          if ($e.ctrlKey) {
            actions.push('open');
          }
          break;
        case 38:
          actions.push('moveUp');
          break;
        case 40:
          actions.push('moveDown');
          break;
        default:
          break;
      }

      for (var i = 0; i < actions.length; i++) {
        this.trigger(actions[i], $e);
        if ($e.isImmediatePropagationStopped()) { break; }
      }
    },

    _onInput: function _onInput() {
      this._setQuery(this.getInputValue());
      this.clearHintIfInvalid();
      this._checkLanguageDirection();
    },

    // endregion

    // region ### private

    _checkLanguageDirection: function _checkLanguageDirection() {
      var dir = (this.$input.css('direction') || 'ltr').toLowerCase();

      if (this.dir !== dir) {
        this.dir = dir;
        this.$hint.attr('dir', dir);
        this.trigger('langDirChanged', dir);
      }
    },

    _setQuery: function _setQuery(val, silent) {
      var areEquivalent, hasDifferentWhitespace;

      areEquivalent = areQueriesEquivalent(val, this.query);
      hasDifferentWhitespace = areEquivalent ?
        this.query.length !== val.length : false;

      this.query = val;

      if (!silent && !areEquivalent) {
        this.trigger('queryChanged', this.query);
      }

      else if (!silent && hasDifferentWhitespace) {
        this.trigger('whitespaceChanged', this.query);
      }
    },

    _updateDescendent: function _updateDescendent(event, id) {
      this.$input.attr('aria-activedescendant', id);
    },

    // endregion

    // region ### public

    bind: function bind() {
      var onBlur, onFocus, onKeydown, onInput;

      // bound functions
      onBlur = _.bind(this._onBlur, this);
      onFocus = _.bind(this._onFocus, this);
      onKeydown = _.bind(this._onKeydown, this);
      onInput = _.bind(this._onInput, this);

      this.$input
      .on('blur.tt', onBlur)
      .on('focus.tt', onFocus)
      .on('keydown.tt', onKeydown)
      .on('input.tt', onInput);

      return this;
    },

    // region Focus

    // Used in hacks/tests

    focus: function focus() {
      this.$input.focus();
    },

    blur: function blur() {
      this.$input.blur();
    },

    // endregion

    getLangDir: function getLangDir() {
      return this.dir;
    },

    // region Query

    getQuery: function getQuery() {
      return this.query || '';
    },

    setQuery: function setQuery(val, silent) {
      this._setQuery(val, silent);
    },

    // Supports typeahead:change event
    hasQueryChangedSinceLastFocus: function hasQueryChangedSinceLastFocus() {
      return this.query !== this.queryWhenFocused;
    },

    // endregion

    // region Input

    getInputValue: function getInputValue() {
      return this.$input.val();
    },

    // endregion

    // region Hint

    getHint: function getHint() {
      return this.$hint.val();
    },

    setHint: function setHint(value) {
      this.$hint.val(value);
    },

    clearHint: function clearHint() {
      this.setHint('');
    },

    clearHintIfInvalid: function clearHintIfInvalid() {
      var val, hint, valIsPrefixOfHint, isValid;

      val = this.getInputValue();
      hint = this.getHint();
      valIsPrefixOfHint = val !== hint && hint.indexOf(val) === 0;
      isValid = val !== '' && valIsPrefixOfHint && !this.hasOverflow();

      !isValid && this.clearHint();
    },

    hasOverflow: function hasOverflow() {
      // 2 is arbitrary, just picking a small number to handle edge cases
      var constraint = this.$input.width() - 2;

      this.$overflowHelper.text(this.getInputValue());

      return this.$overflowHelper.width() >= constraint;
    },

    // endregion

    // Activation-related
    // Supports typeahead:change event
    hasFocus: function hasFocus() {
      return this.$input.is(':focus');
    },

    destroy: function destroy() {
      this.$hint.off('.tt');
      this.$input.off('.tt');
      this.$overflowHelper.remove();

      // #970
      this.$hint = this.$input = this.$overflowHelper = $('<div>');
    }

    // endregion
  });

  // endregion

  return Input;

  // region helper functions

  function buildOverflowHelper($input) {
    return $('<pre aria-hidden="true"></pre>')
    .css({
      // position helper off-screen
      position: 'absolute',
      visibility: 'hidden',
      // avoid line breaks and whitespace collapsing
      whiteSpace: 'pre',
      // use same font css as input to calculate accurate width
      fontFamily: $input.css('font-family'),
      fontSize: $input.css('font-size'),
      fontStyle: $input.css('font-style'),
      fontVariant: $input.css('font-variant'),
      fontWeight: $input.css('font-weight'),
      wordSpacing: $input.css('word-spacing'),
      letterSpacing: $input.css('letter-spacing'),
      textIndent: $input.css('text-indent'),
      textRendering: $input.css('text-rendering'),
      textTransform: $input.css('text-transform')
    })
    .insertAfter($input);
  }

  function areQueriesEquivalent(a, b) {
    return Input.normalizeQuery(a) === Input.normalizeQuery(b);
  }

  // endregion
})();
