describe('Typeahead', function() {
  var www, testData;

  www = WWW();

  beforeEach(function() {
    var $fixture;

    //noinspection JSUnresolvedVariable
    jasmine.Input.useMock();
    //noinspection JSUnresolvedVariable
    jasmine.Dataset.useMock();
    //noinspection JSUnresolvedVariable
    jasmine.Menu.useMock();

    setFixtures('<input type="text">');

    $fixture = $('#jasmine-fixtures');
    this.$input = $fixture.find('input');

    testData = { dataset: 'bar', val: 'foo bar', obj: 'fiz' };

    this.view = new Typeahead({
      input: new Input(),
      menu: new Menu(),
      eventBus: new EventBus({ el: this.$input })
    }, www);

    this.input = this.view.input;
    this.menu = this.view.menu;
  });

  describe('on selectableClicked', function() {
    var eventName, payload;

    beforeEach(function() {
      eventName = 'selectableClicked';
      payload = $('<foo>');
    });

    // Is this a correct state? If the typeahead is deactivated, the menu should be closed, so a selectable shouldn't be clickable.
    describe('when idle', function() {
      beforeEach(function() {
        this.view.deactivate();
      });

      it('should do nothing', function() {
        spyOn(this.view, '_onSelectableClicked');
        this.menu.trigger(eventName, payload);
        expect(this.view._onSelectableClicked).not.toHaveBeenCalled();
      });
    });

    describe('when active', function() {
      beforeEach(function() {
        this.view.activate();
      });

      it('should select the selectable', function() {
        spyOn(this.view, 'select');
        this.menu.trigger(eventName, payload);
        expect(this.view.select).toHaveBeenCalledWith(payload);
      });
    });
  });

  describe('on asyncRequested', function() {
    var eventName;

    beforeEach(function() {
      eventName = 'asyncRequested';
    });

    it('should trigger typeahead:asyncrequest', function() {
      var spy = jasmine.createSpy();

      this.$input.on('typeahead:asyncrequest', spy);
      this.menu.trigger(eventName);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('on asyncCanceled', function() {
    var eventName;

    beforeEach(function() {
      eventName = 'asyncCanceled';
    });

    it('should trigger typeahead:asynccancel', function() {
      var spy = jasmine.createSpy();

      this.$input.on('typeahead:asynccancel', spy);
      this.menu.trigger(eventName);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('on asyncReceived', function() {
    var eventName;

    beforeEach(function() {
      eventName = 'asyncReceived';
    });

    it('should trigger typeahead:asyncreceive', function() {
      var spy = jasmine.createSpy();

      this.$input.on('typeahead:asyncreceive', spy);
      this.menu.trigger(eventName);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('on datasetRendered', function() {
    var eventName;

    beforeEach(function() {
      eventName = 'datasetRendered';
    });

    it('should update the hint', function() {
      this.input.hasOverflow.andReturn(false);
      this.menu.getTopSelectable.andReturn($('<fiz>'));
      this.menu.getSelectableData.andReturn(testData);
      this.input.getInputValue.andReturn(testData.val.slice(0, 2));

      this.menu.trigger(eventName, ['foo'], false, 'bar');

      expect(this.input.setHint).toHaveBeenCalled();
    });

    it('should move cursor to top selectable', function() {
      this.menu.trigger(eventName, ['foo'], false, 'bar');

      expect(this.menu.getActiveSelectable()).toBe(this.menu.getTopSelectable());
    });

    it('should trigger typeahead:render', function() {
      var spy = jasmine.createSpy();

      this.$input.on('typeahead:render', spy);
      this.menu.trigger(eventName, ['foo'], false, 'bar');
      expect(spy).toHaveBeenCalledWith(jasmine.any(Object), ['foo'], false, 'bar');
    });
  });

  describe('on datasetCleared', function() {
    var eventName;

    beforeEach(function() {
      eventName = 'datasetCleared';
    });
    
    it('should update the hint', function() {
      this.input.hasOverflow.andReturn(false);
      this.menu.getTopSelectable.andReturn($('<fiz>'));
      this.menu.getSelectableData.andReturn(testData);
      this.input.getInputValue.andReturn(testData.val.slice(0, 2));

      this.menu.trigger(eventName);

      expect(this.input.setHint).toHaveBeenCalled();
    });
  });

  describe('on focused', function() {
    var eventName;

    beforeEach(function() {
      eventName = 'focused';
    });

    describe('when idle', function() {
      beforeEach(function() {
        this.view.deactivate();
      });

      it('should activate typeahead', function() {
        this.input.trigger(eventName);
        expect(this.view.isActive()).toBe(true);
      });
    });

    describe('when active', function() {
      beforeEach(function() {
        this.view.activate();
      });

      it('should update menu for query if minLength met', function() {
        this.input.getQuery.andReturn('bar');
        this.input.trigger(eventName);
        expect(this.menu.update).toHaveBeenCalledWith('bar');
      });

      it('should not update menu for query if minLength not met', function() {
        this.view.minLength = 1;
        this.input.getQuery.andReturn('');
        this.input.trigger(eventName);
        expect(this.menu.update).not.toHaveBeenCalled();
      });
    });
  });

  describe('on blurred', function() {
    var eventName;

    beforeEach(function() {
      eventName = 'blurred';
    });

    it('should trigger typeahead:change if query changed since focus', function() {
      var spy = jasmine.createSpy();

      this.input.hasQueryChangedSinceLastFocus.andReturn(true);
      this.$input.on('typeahead:change', spy);

      this.input.trigger(eventName);

      expect(spy).toHaveBeenCalled();
    });

    it('should not trigger typeahead:change if query has not changed since focus', function() {
      var spy = jasmine.createSpy();

      this.input.hasQueryChangedSinceLastFocus.andReturn(false);
      this.$input.on('typeahead:change', spy);

      this.input.trigger(eventName);

      expect(spy).not.toHaveBeenCalled();
    });

    describe('when active', function() {
      beforeEach(function() {
        this.view.activate();
      });

      it('should deactivate typeahead', function() {
        this.input.trigger(eventName);
        expect(this.view.isActive()).toBe(false);
      });
    });
  });

  describe('on select', function() {
    var eventName, payload;

    beforeEach(function() {
      eventName = 'select';
      payload = jasmine.createSpyObj('event', ['preventDefault', 'stopImmediatePropagation']);
    });

    describe('when idle', function() {
      beforeEach(function() {
        this.view.deactivate();
      });

      it('should do nothing', function() {
        spyOn(this.view, '_onSelect');
        this.input.trigger(eventName, payload);
        expect(this.view._onSelect).not.toHaveBeenCalled();
      });
    });

    describe('when active and menu is closed', function() {
      beforeEach(function() {
        this.view.activate();
        this.menu.isOpen.andReturn(false);
      });

      it('should do nothing', function() {
        spyOn(this.view, '_onSelect');
        this.input.trigger(eventName, payload);
        expect(this.view._onSelect).not.toHaveBeenCalled();
      });
    });

    describe('when active and menu is open', function() {
      beforeEach(function() {
        this.view.activate();
        this.menu.isOpen.andReturn(true);
      });

      it('should select selectable if there is an active one', function() {
        var $el;

        $el = $('<bah>');
        spyOn(this.view, 'select');
        this.menu.getActiveSelectable.andReturn($el);

        this.input.trigger(eventName, payload);

        expect(this.view.select).toHaveBeenCalledWith($el);
      });

      it('should prevent default and stop immediate propagation if active selectable', function() {
        var $el;

        $el = $('<bah>');
        spyOn(this.view, 'select').andReturn(true);
        this.menu.getActiveSelectable.andReturn($el);

        this.input.trigger(eventName, payload);

        expect(payload.preventDefault).toHaveBeenCalled();
        expect(payload.stopImmediatePropagation).toHaveBeenCalled();
      });

      it('should not prevent default or stop immediate propagation if selection of active selectable fails', function() {
        var $el;

        $el = $('<bah>');
        spyOn(this.view, 'select').andReturn(false);
        this.menu.getActiveSelectable.andReturn($el);

        this.input.trigger(eventName, payload);

        expect(payload.preventDefault).not.toHaveBeenCalled();
        expect(payload.stopImmediatePropagation).not.toHaveBeenCalled();
      });
    });
  });

  describe('on open', function() {
    var eventName, payload;

    beforeEach(function() {
      eventName = 'open';
      payload = jasmine.createSpyObj('event', ['preventDefault', 'stopImmediatePropagation']);
    });

    describe('when idle', function() {
      beforeEach(function() {
        this.view.deactivate();
      });

      it('should do nothing', function() {
        spyOn(this.view, '_onOpen');
        this.input.trigger(eventName, payload);
        expect(this.view._onOpen).not.toHaveBeenCalled();
      });
    });

    describe('when active and not open', function() {
      beforeEach(function() {
        this.view.activate();
        this.view.close();
      });

      it('should open', function() {
        spyOn(this.view, 'open');
        this.input.trigger(eventName, payload);
        expect(this.view.open).toHaveBeenCalled();
      });

      it('should prevent default and stop immediate propagation', function() {
        this.input.trigger(eventName, payload);
        expect(payload.preventDefault).toHaveBeenCalled();
        expect(payload.stopImmediatePropagation).toHaveBeenCalled();
      });
    });
  });

  describe('on close', function() {
    var eventName, payload;

    beforeEach(function() {
      eventName = 'close';
      payload = jasmine.createSpyObj('event', ['preventDefault', 'stopImmediatePropagation']);
    });

    describe('when idle', function() {
      beforeEach(function() {
        this.view.deactivate();
      });

      it('should do nothing', function() {
        spyOn(this.view, '_onClose');
        this.input.trigger(eventName, payload);
        expect(this.view._onClose).not.toHaveBeenCalled();
      });
    });

    describe('when active', function() {
      beforeEach(function() {
        this.view.activate();
      });

      it('should close', function() {
        spyOn(this.view, 'close');
        this.input.trigger(eventName, payload);
        expect(this.view.close).toHaveBeenCalled();
      });

      it('should prevent default and stop immediate propagation', function() {
        spyOn(this.view, 'close');
        this.input.trigger(eventName, payload);
        expect(payload.preventDefault).toHaveBeenCalled();
        expect(payload.stopImmediatePropagation).toHaveBeenCalled();
      });
    });
  });

  describe('on moveUp', function() {
    var eventName, payload;

    beforeEach(function() {
      eventName = 'moveUp';
      payload = jasmine.createSpyObj('event', ['preventDefault', 'stopImmediatePropagation']);
    });

    describe('when idle', function() {
      beforeEach(function() {
        this.view.deactivate();
      });

      it('should do nothing', function() {
        spyOn(this.view, '_onMoveUp');
        this.input.trigger(eventName, payload);
        expect(this.view._onMoveUp).not.toHaveBeenCalled();
      });
    });

    describe('when active and open', function() {
      beforeEach(function() {
        this.view.activate();
        this.menu.isOpen.andReturn(true);
        spyOn(this.view, 'moveCursor');
      });

      it('should move cursor -1', function() {
        this.input.trigger(eventName, payload);
        expect(this.view.moveCursor).toHaveBeenCalledWith(-1);
      });

      it('should prevent default and stop immediate propagation', function() {
        this.input.trigger(eventName, payload);
        expect(payload.preventDefault).toHaveBeenCalled();
        expect(payload.stopImmediatePropagation).toHaveBeenCalled();
      });
    });
  });

  describe('on moveDown', function() {
    var eventName, payload;

    beforeEach(function() {
      eventName = 'moveDown';
      payload = jasmine.createSpyObj('event', ['preventDefault', 'stopImmediatePropagation']);
    });

    describe('when idle', function() {
      beforeEach(function() {
        this.view.deactivate();
      });

      it('should do nothing', function() {
        spyOn(this.view, '_onMoveDown');
        this.input.trigger(eventName, payload);
        expect(this.view._onMoveDown).not.toHaveBeenCalled();
      });
    });

    describe('when active and open', function() {
      beforeEach(function() {
        this.view.activate();
        this.menu.isOpen.andReturn(true);
        spyOn(this.view, 'moveCursor');
      });

      it('should move cursor +1', function() {
        this.input.trigger(eventName, payload);
        expect(this.view.moveCursor).toHaveBeenCalledWith(1);
      });

      it('should prevent default and stop immediate propagation', function() {
        this.input.trigger(eventName, payload);
        expect(payload.preventDefault).toHaveBeenCalled();
        expect(payload.stopImmediatePropagation).toHaveBeenCalled();
      });
    });
  });

  describe('on queryChanged', function() {
    var eventName, payload;

    beforeEach(function() {
      eventName = 'queryChanged';
      payload = '';
    });

    describe('when idle', function() {
      beforeEach(function() {
        this.view.deactivate();
      });

      it('should not update menu', function() {
        this.input.trigger(eventName, payload);
        expect(this.menu.open).not.toHaveBeenCalled();
        expect(this.menu.empty).not.toHaveBeenCalled();
      });
    });

    describe('when active and open', function() {
      beforeEach(function() {
        this.view.activate();
        this.menu.isOpen.andReturn(true);
      });

      it('should empty menu if minLength is not satisfied', function() {
        this.view.minLength = 100;
        this.input.trigger(eventName, payload);

        expect(this.menu.empty).toHaveBeenCalled();
      });

      it('should close menu if minLength is not satisfied', function() {
        this.view.minLength = 100;
        this.input.trigger(eventName, payload);

        expect(this.menu.close).toHaveBeenCalled();
      });

      it('should update menu if minLength is satisfied', function() {
        this.input.trigger(eventName, 'fiz');
        expect(this.menu.update).toHaveBeenCalledWith('fiz');
      });
    });
  });

  describe('on whitespaceChanged', function() {
    var eventName, payload;

    beforeEach(function() {
      eventName = 'whitespaceChanged';
      payload = '';
    });

    describe('when idle', function() {
      beforeEach(function() {
        this.view.deactivate();
      });

      it('should not open menu', function() {
        this.input.trigger(eventName, payload);
        expect(this.menu.open).not.toHaveBeenCalled();
      });
    });

    describe('when active', function() {
      beforeEach(function() {
        this.view.activate();
      });

      it('should open menu', function() {
        this.input.trigger(eventName, payload);
        expect(this.menu.open).toHaveBeenCalled();
      });

      it('should update the hint', function() {
        this.input.hasFocus.andReturn(true);
        this.input.hasOverflow.andReturn(false);
        this.menu.getTopSelectable.andReturn($('<fiz>'));
        this.menu.getSelectableData.andReturn(testData);

        this.input.getInputValue.andReturn(testData.val.slice(0, 2));

        this.input.trigger(eventName, payload);

        expect(this.input.setHint).toHaveBeenCalledWith(testData.val);
      });
    });
  });

  describe('on langDirChanged', function() {
    var eventName, payload;

    beforeEach(function() {
      eventName = 'langDirChanged';
      payload = 'rtl';
    });

    it('should set direction of menu if direction changed', function() {
      this.view.dir = 'ltr';

      this.input.trigger(eventName, payload);

      expect(this.view.dir).toBe(payload);
      expect(this.menu.setLanguageDirection).toHaveBeenCalled();
    });

    it('should do nothing if direction did not changed', function() {
      this.view.dir = payload;

      this.input.trigger(eventName, payload);

      expect(this.view.dir).toBe(payload);
      expect(this.menu.setLanguageDirection).not.toHaveBeenCalled();
    });
  });

  describe('#isEnabled', function() {
    it('should returned enabled status', function() {
      this.view.enable();
      expect(this.view.isEnabled()).toBe(true);
      this.view.disable();
      expect(this.view.isEnabled()).toBe(false);
    });
  });

  describe('#enable', function() {
    it('should set enabled to true', function() {
      this.view.enable();
      expect(this.view.isEnabled()).toBe(true);
    });
  });

  describe('#disable', function() {
    it('should set enabled to false', function() {
      this.view.disable();
      expect(this.view.isEnabled()).toBe(false);
    });
  });

  describe('#isActive', function() {
    it('should return true if active', function() {
      this.view.activate();
      expect(this.view.isActive()).toBe(true);
    });

    it('should return false if idle', function() {
      this.view.deactivate();
      expect(this.view.isActive()).toBe(false);
    });
  });

  describe('#activate', function() {
    describe('when active', function() {
      beforeEach(function() {
        this.view.activate();
      });

      it('should do nothing', function() {
        var spy = jasmine.createSpy();

        this.$input.on('typeahead:beforeactive', spy);
        this.view.activate();
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('when idle and disabled', function() {
      beforeEach(function() {
        this.view.disable();
        this.view.activate();
      });

      it('should do nothing', function() {
        var spy = jasmine.createSpy();

        this.$input.on('typeahead:beforeactive', spy);
        this.view.activate();
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('when idle and enabled', function() {
      beforeEach(function() {
        this.view.enable();
        this.view.deactivate();
      });

      it('should trigger typeahead:beforeactive', function() {
        var spy = jasmine.createSpy();

        this.$input.on('typeahead:beforeactive', spy);
        this.view.activate();
        expect(spy).toHaveBeenCalled();
      });

      it('should support cancellation', function() {
        var spy1, spy2;

        spy1 = jasmine.createSpy().andCallFake(prevent);
        spy2 = jasmine.createSpy();
        this.$input.on('typeahead:beforeactive', spy1);
        this.$input.on('typeahead:active', spy2);

        this.view.activate();

        expect(spy1).toHaveBeenCalled();
        expect(spy2).not.toHaveBeenCalled();
      });

      it('should change state to active', function() {
        expect(this.view.isActive()).toBe(false);
        this.view.activate();
        expect(this.view.isActive()).toBe(true);
      });

      it('should trigger typeahead:active if not canceled', function() {
        var spy = jasmine.createSpy();

        this.$input.on('typeahead:active', spy);
        this.view.activate();
        expect(spy).toHaveBeenCalled();
      });
    });
  });

  describe('#deactivate', function() {
    describe('when idle', function() {
      beforeEach(function() {
        this.view.deactivate();
      });

      it('should do nothing', function() {
        var spy = jasmine.createSpy();

        this.$input.on('typeahead:beforeidle', spy);
        this.view.deactivate();
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('when active', function() {
      beforeEach(function() {
        this.view.activate();
      });

      it('should trigger typeahead:beforeidle', function() {
        var spy = jasmine.createSpy();

        this.$input.on('typeahead:beforeidle', spy);
        this.view.deactivate();
        expect(spy).toHaveBeenCalled();
      });

      it('should support cancellation', function() {
        var spy1, spy2;

        spy1 = jasmine.createSpy().andCallFake(prevent);
        spy2 = jasmine.createSpy();
        this.$input.on('typeahead:beforeidle', spy1);
        this.$input.on('typeahead:idle', spy2);

        this.view.deactivate();

        expect(spy1).toHaveBeenCalled();
        expect(spy2).not.toHaveBeenCalled();
      });

      it('should change state to idle', function() {
        expect(this.view.isActive()).toBe(true);
        this.view.deactivate();
        expect(this.view.isActive()).toBe(false);
      });

      it('should close', function() {
        spyOn(this.view, 'close');
        this.view.deactivate();
        expect(this.view.close).toHaveBeenCalled();
      });

      it('should trigger typeahead:idle if not canceled', function() {
        var spy = jasmine.createSpy();

        this.$input.on('typeahead:idle', spy);
        this.view.deactivate();
        expect(spy).toHaveBeenCalled();
      });
    });
  });

  describe('#isOpen', function() {
    it('should return true if open', function() {
      this.menu.isOpen.andReturn(true);
      expect(this.view.isOpen()).toBe(true);
    });

    it('should return false if closed', function() {
      this.menu.isOpen.andReturn(false);
      expect(this.view.isOpen()).toBe(false);
    });
  });

  describe('#open', function() {
    describe('when open', function() {
      beforeEach(function() {
        spyOn(this.view, 'isOpen').andReturn(true);
      });

      it('should do nothing', function() {
        var spy = jasmine.createSpy();

        this.$input.on('typeahead:beforeopen', spy);
        this.view.open();
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('when closed', function() {
      beforeEach(function() {
        spyOn(this.view, 'isOpen').andReturn(false);
      });

      it('should trigger typeahead:beforeopen', function() {
        var spy = jasmine.createSpy();

        this.$input.on('typeahead:beforeopen', spy);
        this.view.open();
        expect(spy).toHaveBeenCalled();
      });

      it('should support cancellation', function() {
        var spy1, spy2;

        spy1 = jasmine.createSpy().andCallFake(prevent);
        spy2 = jasmine.createSpy();
        this.$input.on('typeahead:beforeopen', spy1);
        this.$input.on('typeahead:open', spy2);

        this.view.open();

        expect(spy1).toHaveBeenCalled();
        expect(spy2).not.toHaveBeenCalled();
      });

      it('should update menu', function() {
        this.view.open();
        expect(this.menu.update).toHaveBeenCalled();
      });

      it('should open menu', function() {
        this.view.open();
        expect(this.menu.open).toHaveBeenCalled();
      });

      it('should update hint', function() {
        this.input.hasOverflow.andReturn(false);
        this.menu.getTopSelectable.andReturn($('<fiz>'));
        this.menu.getSelectableData.andReturn(testData);
        this.input.getInputValue.andReturn(testData.val.slice(0, 2));

        this.view.open();

        expect(this.input.setHint).toHaveBeenCalled();
      });

      it('should trigger typeahead:open', function() {
        var spy = jasmine.createSpy();

        this.$input.on('typeahead:open', spy);
        this.view.open();
        expect(spy).toHaveBeenCalled();
      });
    });
  });

  describe('#close', function() {
    describe('when closed', function() {
      beforeEach(function() {
        spyOn(this.view, 'isOpen').andReturn(false);
      });

      it('should do nothing', function() {
        var spy = jasmine.createSpy();

        this.$input.on('typeahead:beforeclose', spy);
        this.view.open();
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('when open', function() {
      beforeEach(function() {
        spyOn(this.view, 'isOpen').andReturn(true);
      });

      it('should trigger typeahead:beforeclose', function() {
        var spy = jasmine.createSpy();

        this.$input.on('typeahead:beforeclose', spy);
        this.view.close();
        expect(spy).toHaveBeenCalled();
      });

      it('should support cancellation', function() {
        var spy1, spy2;

        spy1 = jasmine.createSpy().andCallFake(prevent);
        spy2 = jasmine.createSpy();
        this.$input.on('typeahead:beforeclose', spy1);
        this.$input.on('typeahead:close', spy2);

        this.view.close();

        expect(spy1).toHaveBeenCalled();
        expect(spy2).not.toHaveBeenCalled();
      });

      it('should close menu', function() {
        this.view.close();
        expect(this.menu.close).toHaveBeenCalled();
      });

      it('should clear hint', function() {
        this.view.close();
        expect(this.input.clearHint).toHaveBeenCalled();
      });

      it('should trigger typeahead:close if not canceled', function() {
        var spy = jasmine.createSpy();

        this.$input.on('typeahead:close', spy);
        this.view.close();
        expect(spy).toHaveBeenCalled();
      });
    });
  });

  describe('#getVal', function() {
    it('should return the current query', function() {
      this.input.getQuery.andReturn('woah');
      expect(this.view.getVal()).toBe('woah');
    });
  });

  describe('#setVal', function() {
    it('should update query', function() {
      this.input.hasFocus.andReturn(true);
      this.view.setVal('woah');
      expect(this.input.setQuery).toHaveBeenCalledWith('woah');
    });
  });


  describe('#select', function() {
    it('should do nothing if element is not a selectable', function() {
      var spy;

      this.menu.getSelectableData.andReturn(null);
      this.$input.on('typeahead:beforeselect', spy = jasmine.createSpy());

      this.view.select($('<bah>'));

      expect(spy).not.toHaveBeenCalled();
    });

    it('should trigger typeahead:beforeselect', function() {
      var spy;

      this.menu.getSelectableData.andReturn(testData);
      this.$input.on('typeahead:beforeselect', spy = jasmine.createSpy());

      this.view.select($('<bah>'));

      expect(spy).toHaveBeenCalledWith(jasmine.any(Object), testData.obj, testData.dataset);
    });

    it('should support cancellation', function() {
      var spy1, spy2;

      spy1 = jasmine.createSpy().andCallFake(prevent);
      spy2 = jasmine.createSpy();

      this.menu.getSelectableData.andReturn(testData);
      this.$input.on('typeahead:beforeselect', spy1).on('typeahead:select', spy2);

      this.view.select($('<bah>'));

      expect(spy1).toHaveBeenCalled();
      expect(spy2).not.toHaveBeenCalled();
    });

    it('should update query silently', function() {
      this.menu.getSelectableData.andReturn(testData);
      this.view.select($('<bah>'));
      expect(this.input.setQuery).toHaveBeenCalledWith(testData.val, true);
    });

    it('should trigger typeahead:select', function() {
      var spy;

      this.menu.getSelectableData.andReturn(testData);
      this.$input.on('typeahead:select', spy = jasmine.createSpy());

      this.view.select($('<bah>'));

      expect(spy).toHaveBeenCalledWith(jasmine.any(Object), testData.obj, testData.dataset);
    });

    it('should close', function() {
      spyOn(this.view, 'close');
      this.menu.getSelectableData.andReturn(testData);

      this.view.select($('<bah>'));

      expect(this.view.close).toHaveBeenCalled();
    });
  });

  describe('#moveCursor', function() {
    beforeEach(function() {
      this.input.getQuery.andReturn('foo');
    });

    it('should move cursor if minLength is not satisfied', function() {
      var spy = jasmine.createSpy();

      this.menu.selectableRelativeToCursor.andReturn($());
      this.view.minLength = 100;
      this.menu.update.andReturn(true);

      this.$input.on('typeahead:beforecursorchange', spy);

      this.view.moveCursor(1);

      expect(spy).toHaveBeenCalled();
    });

    it('should move cursor if invalid update', function() {
      var spy = jasmine.createSpy();

      this.menu.update.andReturn(false);

      this.menu.selectableRelativeToCursor.andReturn($());

      this.$input.on('typeahead:beforecursorchange', spy);

      this.view.moveCursor(1);

      expect(spy).toHaveBeenCalled();
    });

    it('should not move cursor if valid update', function() {
      var spy = jasmine.createSpy();

      this.menu.update.andReturn(true);
      this.menu.selectableRelativeToCursor.andReturn($());

      this.$input.on('typeahead:beforecursorchange', spy);

      this.view.moveCursor(1);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should trigger typeahead:beforecursorchange', function() {
      var spy = jasmine.createSpy();

      this.menu.selectableRelativeToCursor.andReturn($());

      this.$input.on('typeahead:beforecursorchange', spy);

      this.menu.getSelectableData.andReturn(null);
      this.view.moveCursor(1);
      expect(spy).toHaveBeenCalledWith(jasmine.any(Object), null, null);

      this.menu.getSelectableData.andReturn(testData);
      this.view.moveCursor(1);
      expect(spy).toHaveBeenCalledWith(jasmine.any(Object), testData.obj, testData.dataset);
    });

    it('should support cancellation', function() {
      var spy = jasmine.createSpy().andCallFake(prevent);

      this.menu.selectableRelativeToCursor.andReturn($());

      this.$input.on('typeahead:beforecursorchange', spy);
      this.view.moveCursor(1);
      expect(this.menu.setCursor).not.toHaveBeenCalled();
    });

    it('should trigger cursorchange after setting cursor', function() {
      var spy = jasmine.createSpy();

      this.menu.selectableRelativeToCursor.andReturn($());
      this.$input.on('typeahead:cursorchange', spy);

      this.menu.getSelectableData.andReturn(null);
      this.view.moveCursor(1);
      expect(spy).toHaveBeenCalledWith(jasmine.any(Object), null, null);

      this.menu.getSelectableData.andReturn(testData);
      this.view.moveCursor(1);
      expect(spy).toHaveBeenCalledWith(jasmine.any(Object), testData.obj, testData.dataset);
    });
  });

  describe('#destroy', function() {
    it('should destroy input', function() {
      this.view.destroy();

      expect(this.input.destroy).toHaveBeenCalled();
    });

    it('should destroy menu', function() {
      this.view.destroy();

      expect(this.menu.destroy).toHaveBeenCalled();
    });
  });

  function prevent($e) { $e.preventDefault(); }
});
