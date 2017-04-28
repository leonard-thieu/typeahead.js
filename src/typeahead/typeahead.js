/*
 * typeahead.js
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2014 Twitter, Inc. and other contributors; Licensed MIT
 */

/**
 * @mixes {Build}
 */
var Typeahead = (function() {
  'use strict';

  // region constructor

  function Typeahead(o, www) {
    o = o || {};

    if (!o.input) {
      $.error('missing input');
    }

    if (!o.menu) {
      $.error('missing menu');
    }

    if (!o.eventBus) {
      $.error('missing event bus');
    }

    www.mixin(this);

    this.eventBus = o.eventBus;
    this.minLength = _.isNumber(o.minLength) ? o.minLength : 1;

    this.input = o.input;
    this.menu = o.menu;

    this.enabled = true;

    // activate the typeahead on init if the input has focus
    this.active = false;
    this.input.hasFocus() && this.activate();

    // detect the initial lang direction
    this.dir = this.input.getLangDir();

    this._hacks();

    this.menu.bind()
    .onSync('selectableClicked', this._onSelectableClicked, this)
    .onSync('datasetCleared', this._onDatasetCleared, this)
    .onSync('datasetRendered', this._onDatasetRendered, this)
    .onSync('asyncRequested', this._onAsyncRequested, this)
    .onSync('asyncCanceled', this._onAsyncCanceled, this)
    .onSync('asyncReceived', this._onAsyncReceived, this);

    this.input.bind()
    .onSync('focused', this._onFocused, this)
    .onSync('blurred', this._onBlurred, this)
    .onSync('select', this._onSelect, this)
    .onSync('open', this._onOpen, this)
    .onSync('close', this._onClose, this)
    .onSync('moveUp', this._onMoveUp, this)
    .onSync('moveDown', this._onMoveDown, this)
    .onSync('queryChanged', this._onQueryChanged, this)
    .onSync('whitespaceChanged', this._onWhitespaceChanged, this)
    .onSync('langDirChanged', this._onLangDirChanged, this);
  }

  // endregion

  // region instance methods

  /**
   * @mixin {Typeahead.prototype}
   */
  _.mixin(Typeahead.prototype, {

    // here's where hacks get applied and we don't feel bad about it
    _hacks: function _hacks() {
      var $input, $menu;

      // these default values are to make testing easier
      $input = this.input.$input || $('<div>');
      $menu = this.menu.$node || $('<div>');

      // #705: if there's scrollable overflow, ie doesn't support
      // blur cancellations when the scrollbar is clicked
      //
      // #351: preventDefault won't cancel blurs in ie <= 8
      $input.on('blur.tt', function($e) {
        var active, isActive, hasActive;

        active = document.activeElement;
        isActive = $menu.is(active);
        hasActive = $menu.has(active).length > 0;

        if (_.isMsie() && (isActive || hasActive)) {
          $e.preventDefault();
          // stop immediate in order to prevent Input#_onBlur from
          // getting executed
          $e.stopImmediatePropagation();
          _.defer(function() { $input.focus(); });
        }
      });

      // #351: prevents input blur due to clicks within menu
      $menu.on('mousedown.tt', function($e) { $e.preventDefault(); });
    },

    // region ### event handlers

    // region ### menu

    _onSelectableClicked: function _onSelectableClicked(type, $el) {
      this.select($el);
    },

    _onDatasetCleared: function _onDatasetCleared() {
      this._updateHint();
    },

    _onDatasetRendered: function _onDatasetRendered(type, suggestions, async, dataset) {
      this._updateHint();
      this.moveCursor(0);
      this.eventBus.trigger('render', suggestions, async, dataset);
    },

    _onAsyncRequested: function _onAsyncRequested(type, dataset, query) {
      this.eventBus.trigger('asyncrequest', query, dataset);
    },

    _onAsyncCanceled: function _onAsyncCanceled(type, dataset, query) {
      this.eventBus.trigger('asynccancel', query, dataset);
    },

    _onAsyncReceived: function _onAsyncReceived(type, dataset, query) {
      this.eventBus.trigger('asyncreceive', query, dataset);
    },

    // endregion

    // region ### input

    _onFocused: function _onFocused() {
      if (this.activate()) {
        this._minLengthMet() && this.menu.update(this.input.getQuery());
      }
    },

    _onBlurred: function _onBlurred() {
      if (this.deactivate()) {
        if (this.input.hasQueryChangedSinceLastFocus()) {
          this.eventBus.trigger('change', this.input.getQuery());
        }
      }
    },

    _onSelect: function _onSelect(type, $e) {
      var $selectable;

      if (this.isActive() && this.isOpen()) {
        if ($selectable = this.menu.getActiveSelectable()) {
          if (this.select($selectable)) {
            $e.preventDefault();
            $e.stopImmediatePropagation();
          }
        }
      }
    },

    _onOpen: function _onOpen(type, $e) {
      if (this.isActive() && !this.isOpen()) {
        this.open();
        $e.preventDefault();
        $e.stopImmediatePropagation();
      }
    },

    _onClose: function _onClose(type, $e) {
      if (this.isActive()) {
        this.close();
        $e.preventDefault();
        $e.stopImmediatePropagation();
      }
    },

    _onMoveUp: function _onMoveUp(type, $e) {
      if (this.isActive() && this.isOpen()) {
        this.moveCursor(-1);
        $e.preventDefault();
        $e.stopImmediatePropagation();
      }
    },

    _onMoveDown: function _onMoveDown(type, $e) {
      if (this.isActive() && this.isOpen()) {
        this.moveCursor(+1);
        $e.preventDefault();
        $e.stopImmediatePropagation();
      }
    },

    _onQueryChanged: function _onQueryChanged(e, query) {
      if (this.isActive() && this.isOpen()) {
        if (this._minLengthMet(query)) {
          this.menu.update(query);
        } else {
          this.menu.empty();
          this.close();
        }
      }
    },

    _onWhitespaceChanged: function _onWhitespaceChanged() {
      if (this.isActive() && this.open()) {
        this._updateHint();
      }
    },

    _onLangDirChanged: function _onLangDirChanged(e, dir) {
      if (this.dir !== dir) {
        this.dir = dir;
        this.menu.setLanguageDirection(dir);
      }
    },

    // endregion

    // endregion

    // region ### private

    _minLengthMet: function _minLengthMet(query) {
      query = _.isString(query) ? query : (this.input.getQuery() || '');

      return query.length >= this.minLength;
    },

    _updateHint: function _updateHint() {
      var $selectable, data, val, query, escapedQuery, frontMatchRegEx, match;

      $selectable = this.menu.getTopSelectable();
      data = this.menu.getSelectableData($selectable);
      val = this.input.getInputValue();

      if (data && !_.isBlankString(val) && !this.input.hasOverflow()) {
        query = Input.normalizeQuery(val);
        escapedQuery = _.escapeRegExChars(query);

        // match input value, then capture trailing text
        frontMatchRegEx = new RegExp('^(?:' + escapedQuery + ')(.+$)', 'i');
        match = frontMatchRegEx.exec(data.val);

        // clear hint if there's no trailing text
        match && this.input.setHint(val + match[1]);
      }

      else {
        this.input.clearHint();
      }
    },

    // endregion

    // region ### public

    // region Toggle

    // Toggle feature allows consumer to toggle on and off the plugin.

    isEnabled: function isEnabled() {
      return this.enabled;
    },

    enable: function enable() {
      this.enabled = true;
    },

    disable: function disable() {
      this.enabled = false;
    },

    // endregion

    // region Activation

    // Activation feature ensures menu closes when the input loses focus.

    isActive: function isActive() {
      return this.active;
    },

    activate: function activate() {
      // already active
      if (this.isActive()) {
        return true;
      }

      // unable to activate either due to the typeahead being disabled
      // or due to the active event being prevented
      else if (!this.isEnabled() || this.eventBus.before('active')) {
        return false;
      }

      // activate
      else {
        this.active = true;
        this.eventBus.trigger('active');
        return true;
      }
    },

    deactivate: function deactivate() {
      // already idle
      if (!this.isActive()) {
        return true;
      }

      // unable to deactivate due to the idle event being prevented
      else if (this.eventBus.before('idle')) {
        return false;
      }

      // deactivate
      else {
        this.active = false;
        this.close();
        this.eventBus.trigger('idle');
        return true;
      }
    },

    // endregion

    // region Visibility

    // Visibility feature opens and closes the suggestions menu.

    isOpen: function isOpen() {
      return this.menu.isOpen();
    },

    open: function open() {
      if (!this.isOpen() && !this.eventBus.before('open')) {
        this.menu.update(this.input.getQuery());
        this.menu.open();
        this._updateHint();
        this.eventBus.trigger('open');
      }

      return this.isOpen();
    },

    close: function close() {
      if (this.isOpen() && !this.eventBus.before('close')) {
        this.menu.close();
        this.input.clearHint();
        this.eventBus.trigger('close');
      }
      return !this.isOpen();
    },

    // endregion

    // region Query

    setVal: function setVal(val) {
      // expect val to be a string, so be safe, and coerce
      this.input.setQuery(_.toStr(val));
    },

    getVal: function getVal() {
      return this.input.getQuery();
    },

    // endregion

    // region Functions

    select: function select($selectable) {
      var data = this.menu.getSelectableData($selectable);

      if (data && !this.eventBus.before('select', data.obj, data.dataset)) {
        this.input.setQuery(data.val, true);

        this.eventBus.trigger('select', data.obj, data.dataset);
        this.close();

        // return true if selection succeeded
        return true;
      }

      return false;
    },

    moveCursor: function moveCursor(delta) {
      var query, $candidate, data, suggestion, datasetName, cancelMove, id;

      query = this.input.getQuery();

      $candidate = this.menu.selectableRelativeToCursor(delta);
      data = this.menu.getSelectableData($candidate);
      suggestion = data ? data.obj : null;
      datasetName = data ? data.dataset : null;
      id = $candidate ? $candidate.attr('id') : null;
      this.input.trigger('cursorchange', id);

      // update will return true when it's a new query and new suggestions
      // need to be fetched – in this case we don't want to move the cursor
      cancelMove = this._minLengthMet() && this.menu.update(query);

      if (!cancelMove && !this.eventBus.before('cursorchange', suggestion, datasetName)) {
        this.menu.setCursor($candidate);

        this.eventBus.trigger('cursorchange', suggestion, datasetName);

        // return true if move succeeded
        return true;
      }

      return false;
    },

    // endregion

    destroy: function destroy() {
      this.input.destroy();
      this.menu.destroy();
    }

    // endregion
  });

  // endregion

  return Typeahead;
})();
