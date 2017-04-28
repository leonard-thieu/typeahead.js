describe('Input', function() {
  var KEYS, www;

  KEYS = {
    enter: 13,
    esc: 27,
    tab: 9,
    space: 32,
    left: 37,
    right: 39,
    up: 38,
    down: 40,
    normal: 65 // "A" key
  };

  www = WWW();

  beforeEach(function() {
    var $fixture;

    setFixtures(fixtures.html.input + fixtures.html.hint);

    $fixture = $('#jasmine-fixtures');
    this.$input = $fixture.find('.tt-input');
    this.$hint = $fixture.find('.tt-hint');

    this.view = new Input({ input: this.$input, hint: this.$hint }, www).bind();
  });

  it('should throw an error if no input is provided', function() {
    expect(noInput).toThrow();

    function noInput() { new Input({}, www); }
  });

  describe('when the blur DOM event is triggered', function() {
    it('should trigger blurred', function() {
      var spy;

      this.view.onSync('blurred', spy = jasmine.createSpy());
      this.$input.blur();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('when the focus DOM event is triggered', function() {
    it('should update queryWhenFocused', function() {
      this.view.setQuery('hi');
      this.$input.focus();
      expect(this.view.hasQueryChangedSinceLastFocus()).toBe(false);
      this.view.setQuery('bye');
      expect(this.view.hasQueryChangedSinceLastFocus()).toBe(true);
    });

    it('should trigger focused', function() {
      var spy;

      this.view.onSync('focused', spy = jasmine.createSpy());
      this.$input.focus();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('when the keydown DOM event is triggered by tab', function() {
    it('should trigger open', function() {
      var spy;

      this.view.onSync('open', spy = jasmine.createSpy());
      simulateKeyEvent(this.$input, 'keydown', KEYS.tab);

      expect(spy).toHaveBeenCalled();
    });

    it('should not trigger another event if immediate propagation is stopped', function() {
      var spy;

      this.view.onSync('open', function(event, $e) {
        $e.stopImmediatePropagation();
      });
      this.view.onSync('moveDown moveUp', spy = jasmine.createSpy());
      simulateKeyEvent(this.$input, 'keydown', KEYS.tab);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should trigger moveDown if no modifiers were pressed', function() {
      var spy;

      this.view.onSync('moveDown', spy = jasmine.createSpy());
      simulateKeyEvent(this.$input, 'keydown', KEYS.tab);

      expect(spy).toHaveBeenCalled();
    });

    it('should trigger moveUp if shift was pressed', function() {
      var spy;

      this.view.onSync('moveUp', spy = jasmine.createSpy());
      simulateKeyEvent(this.$input, 'keydown', KEYS.tab, true);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('when the keydown DOM event is triggered by esc', function() {
    it('should trigger close', function() {
      var spy;

      this.view.onSync('close', spy = jasmine.createSpy());
      simulateKeyEvent(this.$input, 'keydown', KEYS.esc);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('when the keydown DOM event is triggered by space', function() {
    it('should trigger open if ctrl was pressed', function() {
      var spy;

      this.view.onSync('open', spy = jasmine.createSpy());
      simulateKeyEvent(this.$input, 'keydown', KEYS.space, true);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('when the keydown DOM event is triggered by enter', function() {
    it('should trigger select', function() {
      var spy;

      this.view.onSync('select', spy = jasmine.createSpy());
      simulateKeyEvent(this.$input, 'keydown', KEYS.enter);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('when the keydown DOM event is triggered by up', function() {
    it('should trigger moveUp', function() {
      var spy;

      this.view.onSync('moveUp', spy = jasmine.createSpy());
      simulateKeyEvent(this.$input, 'keydown', KEYS.up);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('when the keydown DOM event is triggered by down', function() {
    it('should trigger moveDown', function() {
      var spy;

      this.view.onSync('moveDown', spy = jasmine.createSpy());
      simulateKeyEvent(this.$input, 'keydown', KEYS.down);

      expect(spy).toHaveBeenCalled();
    });
  });

  // NOTE: have to treat these as async because the ie polyfill acts
  // in a async manner
  describe('when the input DOM event is triggered', function() {
    it('should trigger queryChanged if the query changed', function() {
      var spy;

      this.view.setQuery('wine');
      this.$input.val('cheese');
      this.view.onSync('queryChanged', spy = jasmine.createSpy());

      simulateInputEvent(this.$input);

      expect(spy).toHaveBeenCalled();
    });

    it('should clear hint if invalid', function() {
      spyOn(this.view, 'clearHintIfInvalid');
      simulateInputEvent(this.$input);
      expect(this.view.clearHintIfInvalid).toHaveBeenCalled();
    });

    it('should check lang direction', function() {
      var spy;

      this.$input.css('direction', 'rtl');
      this.view.onSync('langDirChanged', spy = jasmine.createSpy());

      simulateInputEvent(this.$input);

      expect(this.view.dir).toBe('rtl');
      expect(this.$hint).toHaveAttr('dir', 'rtl');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('.normalizeQuery', function() {
    it('should strip leading whitespace', function() {
      expect(Input.normalizeQuery('  foo')).toBe('foo');
    });

    it('should condense whitespace', function() {
      expect(Input.normalizeQuery('foo   bar')).toBe('foo bar');
    });

    it('should play nice with non-string values', function() {
      expect(Input.normalizeQuery(2)).toBe('2');
      expect(Input.normalizeQuery([])).toBe('');
      expect(Input.normalizeQuery(null)).toBe('');
      expect(Input.normalizeQuery(undefined)).toBe('');
      expect(Input.normalizeQuery(false)).toBe('false');
    });
  });

  describe('#focus', function() {
    it('should focus the input', function() {
      this.$input.blur();
      this.view.focus();

      expect(this.$input).toBeFocused();
    });
  });

  describe('#blur', function() {
    it('should blur the input', function() {
      this.$input.focus();
      this.view.blur();

      expect(this.$input).not.toBeFocused();
    });
  });

  describe('#getQuery', function() {
    it('should act as getter to the query property', function() {
      this.view.setQuery('mouse');
      expect(this.view.getQuery()).toBe('mouse');
    });
  });

  describe('#setQuery', function() {
    it('should act as setter to the query property', function() {
      this.view.setQuery('mouse');
      expect(this.view.getQuery()).toBe('mouse');
    });

    it('should trigger queryChanged if the query changed', function() {
      var spy;

      this.view.setQuery('wine');
      this.view.onSync('queryChanged', spy = jasmine.createSpy());
      this.view.setQuery('cheese');

      expect(spy).toHaveBeenCalled();
    });

    it('should trigger whitespaceChanged if whitespace changed', function() {
      var spy;

      this.view.setQuery('wine   bar');
      this.view.onSync('whitespaceChanged', spy = jasmine.createSpy());
      this.view.setQuery('wine bar');

      expect(spy).toHaveBeenCalled();
    });

    it('should clear hint if invalid', function() {
      spyOn(this.view, 'clearHintIfInvalid');
      simulateInputEvent(this.$input);
      expect(this.view.clearHintIfInvalid).toHaveBeenCalled();
    });
  });

  describe('#hasQueryChangedSinceLastFocus', function() {
    it('should return true if the query has changed since focus', function() {
      this.view.setQuery('hi');
      this.$input.focus();
      this.view.setQuery('bye');
      expect(this.view.hasQueryChangedSinceLastFocus()).toBe(true);
    });

    it('should return false if the query has not changed since focus', function() {
      this.view.setQuery('hi');
      this.$input.focus();
      expect(this.view.hasQueryChangedSinceLastFocus()).toBe(false);
    });
  });

  describe('#getInputValue', function() {
    it('should act as getter to the input value', function() {
      this.$input.val('cheese');
      expect(this.view.getInputValue()).toBe('cheese');
    });
  });

  describe('#getHint/#setHint', function() {
    it('should act as getter/setter to value of hint', function() {
      this.view.setHint('mountain');
      expect(this.view.getHint()).toBe('mountain');
    });
  });

  describe('#clearHint', function() {
    it('should set the hint value to the empty string', function() {
      this.view.setHint('cheese');
      this.view.clearHint();

      expect(this.view.getHint()).toBe('');
    });
  });

  describe('#clearHintIfInvalid', function() {
    it('should clear hint if input value is empty string', function() {
      this.$input.val('');
      this.view.setHint('cheese');
      this.view.clearHintIfInvalid();

      expect(this.view.getHint()).toBe('');
    });

    it('should clear hint if input value is not prefix of hint', function() {
      this.$input.val('milk');
      this.view.setHint('cheese');
      this.view.clearHintIfInvalid();

      expect(this.view.getHint()).toBe('');
    });

    it('should not clear hint if input value is prefix of hint', function() {
      this.$input.val('che');
      this.view.setHint('cheese');
      this.view.clearHintIfInvalid();

      expect(this.view.getHint()).toBe('cheese');
    });

    it('should clear hint if overflow exists', function() {
      spyOn(this.view, 'hasOverflow').andReturn(true);
      this.$input.val('che');
      this.view.setHint('cheese');
      this.view.clearHintIfInvalid();

      expect(this.view.getHint()).toBe('');
    });
  });

  describe('#hasOverflow', function() {
    it('should return true if the input has overflow text', function() {
      var longStr = new Array(1000).join('a');

      this.$input.val(longStr);
      expect(this.view.hasOverflow()).toBe(true);
    });

    it('should return false if the input has no overflow text', function() {
      var shortStr = 'aah';

      this.$input.val(shortStr);
      expect(this.view.hasOverflow()).toBe(false);
    });
  });

  describe('#destroy', function() {
    it('should remove event handlers', function() {
      var $input, $hint;

      $hint = this.view.$hint;
      $input = this.view.$input;

      spyOn($hint, 'off');
      spyOn($input, 'off');

      this.view.destroy();

      expect($hint.off).toHaveBeenCalledWith('.tt');
      expect($input.off).toHaveBeenCalledWith('.tt');
    });

    it('should set DOM element references to dummy element', function() {
      var $hint, $input, $overflowHelper;

      $hint = this.view.$hint;
      $input = this.view.$input;
      $overflowHelper = this.view.$overflowHelper;

      this.view.destroy();

      expect(this.view.$hint).not.toBe($hint);
      expect(this.view.$input).not.toBe($input);
      expect(this.view.$overflowHelper).not.toBe($overflowHelper);
    });
  });

  // helper functions
  // ----------------

  function simulateInputEvent($node) {
    var $e, type;

    type = _.isMsie() ? 'keypress' : 'input';
    $e = $.Event(type);

    $node.trigger($e);
  }

  function simulateKeyEvent($node, type, key, withModifier) {
    var $e;

    $e = $.Event(type, {
      keyCode: key,
      altKey: !!withModifier,
      ctrlKey: !!withModifier,
      metaKey: !!withModifier,
      shiftKey: !!withModifier
    });

    spyOn($e, 'preventDefault');
    $node.trigger($e);

    return $e;
  }
});
