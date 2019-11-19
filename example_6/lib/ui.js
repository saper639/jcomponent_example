COMPONENT('selected', 'class:selected;selector:a;attr:if', function(self, config) {

	self.bindvisible(20);
	self.readonly();

	self.configure = function(key, value) {
		switch (key) {
			case 'datasource':
				self.datasource(value, function() {
					self.refresh();
				});
				break;
		}
	};

	self.setter = function(value) {
		var cls = config.class;
		self.find(config.selector).each(function() {
			var el = $(this);
			if (el.attrd(config.attr) === value)
				el.aclass(cls);
			else
				el.hclass(cls) && el.rclass(cls);
		});
	};
});

COMPONENT('part', 'hide:1;loading:1', function(self, config) {

	var init = false;
	var clid = null;
	var downloading = false;

	self.releasemode && self.releasemode('true');
	self.readonly();

	self.setter = function(value) {

		if (config.if !== value) {

			if (!self.hclass('hidden')) {
				config.hidden && EXEC(config.hidden);
				config.hide && self.aclass('hidden');
				self.release(true);
			}

			if (config.cleaner && init && !clid)
				clid = setTimeout(self.clean, config.cleaner * 60000);

			return;
		}

		config.hide && self.rclass('hidden');

		if (self.element[0].hasChildNodes()) {

			if (clid) {
				clearTimeout(clid);
				clid = null;
			}

			self.release(false);
			config.reload && EXEC(config.reload);
			config.default && DEFAULT(config.default, true);

			setTimeout(function() {
				self.element.SETTER('*', 'resize');
			}, 200);

		} else {

			if (downloading)
				return;

			config.loading && SETTER('loading', 'show');
			downloading = true;

			setTimeout(function() {

				var preparator = config.path == null ? null : function(content) {
					return content.replace(/~PATH~/g, config.path);
				};

				if (preparator == null && config.replace)
					preparator = GET(config.replace);

				self.import(config.url, function() {
					downloading = false;

					if (!init) {
						config.init && EXEC(config.init);
						init = true;
					}

					self.release(false);
					config.reload && EXEC(config.reload, true);
					config.default && DEFAULT(config.default, true);
					config.loading && SETTER('loading', 'hide', 500);
					self.hclass('invisible') && self.rclass('invisible', 500);

					setTimeout(function() {
						self.element.SETTER('*', 'resize');
					}, 200);

				}, true, preparator);
			}, 200);
		}
	};

	self.configure = function(key, value) {
		switch (key) {
			case 'if':
				config.if = value + '';
				break;
		}
	};

	self.clean = function() {
		if (self.hclass('hidden')) {
			config.clean && EXEC(config.clean);
			setTimeout(function() {
				self.empty();
				init = false;
				clid = null;
				setTimeout(FREE, 1000);
			}, 1000);
		}
	};
});

/*TEXTBOX*/
COMPONENT('textbox', function(self, config) {

	var input, content = null, isfilled = false;
	var innerlabel = function() {
		var is = !!input[0].value;
		if (isfilled !== is) {
			isfilled = is;
			self.tclass('ui-textbox-filled', isfilled);
		}
	};

	self.nocompile && self.nocompile();

	self.validate = function(value) {

		if ((!config.required || config.disabled) && !self.forcedvalidation())
			return true;

		if (self.type === 'date')
			return value instanceof Date && !isNaN(value.getTime());

		if (value == null)
			value = '';
		else
			value = value.toString();

		EMIT('reflow', self.name);

		if (config.minlength && value.length < config.minlength)
			return false;

		switch (self.type) {
			case 'email':
				return value.isEmail();
			case 'phone':
				return value.isPhone();
			case 'url':
				return value.isURL();
			case 'currency':
			case 'number':
				return value > 0;
		}

		return config.validation ? !!self.evaluate(value, config.validation, true) : value.length > 0;
	};

	self.make = function() {

		content = self.html();

		self.type = config.type;
		self.format = config.format;

		self.event('click', '.fa-calendar', function(e) {
			if (!config.disabled && !config.readonly && config.type === 'date') {
				e.preventDefault();
				SETTER('calendar', 'toggle', self.element, self.get(), function(date) {
					self.change(true);
					self.set(date);
				});
			}
		});

		self.event('click', '.fa-caret-up,.fa-caret-down', function() {
			if (!config.disabled && !config.readonly && config.increment) {
				var el = $(this);
				var inc = el.hclass('fa-caret-up') ? 1 : -1;
				self.change(true);
				self.inc(inc);
			}
		});

		self.event('click', '.ui-textbox-label', function() {
			input.focus();
		});

		self.event('click', '.ui-textbox-control-icon', function() {
			if (config.disabled || config.readonly)
				return;
			if (self.type === 'search') {
				self.$stateremoved = false;
				$(this).rclass('fa-times').aclass('fa-search');
				self.set('');
			} else if (self.type === 'password') {
				var el = $(this);
				var type = input.attr('type');

				input.attr('type', type === 'text' ? 'password' : 'text');
				el.rclass2('fa-').aclass(type === 'text' ? 'fa-eye' : 'fa-eye-slash');
			} else if (config.iconclick)
				EXEC(config.iconclick, self);
		});

		self.event('focus', 'input', function() {
			if (!config.disabled && !config.readonly && config.autocomplete)
				EXEC(config.autocomplete, self);
		});

		self.event('input', 'input', innerlabel);
		self.redraw();
		config.iconclick && self.configure('iconclick', config.iconclick);
	};

	self.setter2 = function(value) {
		if (self.type === 'search') {
			if (self.$stateremoved && !value)
				return;
			self.$stateremoved = !value;
			self.find('.ui-textbox-control-icon').tclass('fa-times', !!value).tclass('fa-search', !value);
		}
		innerlabel();
	};

	self.redraw = function() {

		var attrs = [];
		var builder = [];
		var tmp = 'text';

		switch (config.type) {
			case 'password':
				tmp = config.type;
				break;
			case 'number':
			case 'phone':
				isMOBILE && (tmp = 'tel');
				break;
		}

		self.tclass('ui-disabled', !!config.disabled);
		self.tclass('ui-textbox-required', !!config.required);
		self.type = config.type;
		attrs.attr('type', tmp);
		config.placeholder && !config.innerlabel && attrs.attr('placeholder', config.placeholder);
		config.maxlength && attrs.attr('maxlength', config.maxlength);
		config.keypress != null && attrs.attr('data-jc-keypress', config.keypress);
		config.delay && attrs.attr('data-jc-keypress-delay', config.delay);
		config.disabled && attrs.attr('disabled');
		config.readonly && attrs.attr('readonly');
		config.error && attrs.attr('error');
	        config.class && attrs.attr('class', config.class);
        	config.id && attrs.attr('id', config.id);

		attrs.attr('data-jc-bind', '');

		if (config.autofill) {
			attrs.attr('name', self.path.replace(/\./g, '_'));
			self.autofill && self.autofill();
		} else {
			attrs.attr('name', 'input' + Date.now());
			attrs.attr('autocomplete', 'new-password');
		}

		config.align && attrs.attr('class', 'ui-' + config.align);
		!isMOBILE && config.autofocus && attrs.attr('autofocus');

		builder.push('<div class="ui-textbox-input"><input {0} /></div>'.format(attrs.join(' ')));

		var icon = config.icon;
		var icon2 = config.icon2;

		if (!icon2 && self.type === 'date')
			icon2 = 'calendar';
		else if (!icon2 && self.type === 'password')
			icon2 = 'eye';
		else if (self.type === 'search')
			icon2 = 'search';

		icon2 && builder.push('<div class="ui-textbox-control"><span class="fa fa-{0} ui-textbox-control-icon"></span></div>'.format(icon2));
		config.increment && !icon2 && builder.push('<div class="ui-textbox-control"><span class="fa fa-caret-up"></span><span class="fa fa-caret-down"></span></div>');

		if (config.label)
			content = config.label;

		self.tclass('ui-textbox-innerlabel', !!config.innerlabel);

		if (content.length) {
			var html = builder.join('');
			builder = [];
			builder.push('<div class="ui-textbox-label">');
			icon && builder.push('<i class="fa fa-{0}"></i> '.format(icon));
			builder.push('<span>' + content + (content.substring(content.length - 1) === '?' ? '' : ':') + '</span>');
			builder.push('</div><div class="ui-textbox">{0}</div>'.format(html));
			config.error && builder.push('<div class="ui-textbox-helper"><i class="fa fa-warning" aria-hidden="true"></i> {0}</div>'.format(config.error));
			self.html(builder.join(''));
			self.aclass('ui-textbox-container');
			input = self.find('input');
		} else {
			config.error && builder.push('<div class="ui-textbox-helper"><i class="fa fa-warning" aria-hidden="true"></i> {0}</div>'.format(config.error));
			self.aclass('ui-textbox ui-textbox-container');
			self.html(builder.join(''));
			input = self.find('input');
		}
                if (config.class) { 
			self.find('.ui-textbox-input').rclass('ui-textbox-input');
                        self.find('.ui-textbox').rclass('ui-textbox'); 
			self.rclass('ui-textbox'); 
                } 
	};

	self.configure = function(key, value, init) {

		if (init)
			return;

		var redraw = false;

		switch (key) {
			case 'readonly':
				self.find('input').prop('readonly', value);
				break;
			case 'disabled':
				self.tclass('ui-disabled', value);
				self.find('input').prop('disabled', value);
				self.reset();
				break;
			case 'format':
				self.format = value;
				self.refresh();
				break;
			case 'required':
				self.noValid(!value);
				!value && self.state(1, 1);
				self.tclass('ui-textbox-required', value === true);
				break;
			case 'placeholder':
				input.prop('placeholder', value || '');
				break;
			case 'maxlength':
				input.prop('maxlength', value || 1000);
				break;
			case 'autofill':
				input.prop('name', value ? self.path.replace(/\./g, '_') : '');
				break;
			case 'label':
				if (content && value)
					self.find('.ui-textbox-label span').html(value);
				else
					redraw = true;
				content = value;
				break;
			case 'type':
				self.type = value;
				if (value === 'password')
					value = 'password';
				else
					self.type = 'text';
				self.find('input').prop('type', self.type);
				break;
			case 'align':
				input.rclass(input.attr('class')).aclass('ui-' + value || 'left');
				break;
			case 'autofocus':
				input.focus();
				break;
			case 'icon2click': // backward compatibility
			case 'iconclick':
				config.iconclick = value;
				self.find('.ui-textbox-control').css('cursor', value ? 'pointer' : 'default');
				break;
			case 'icon':
				var tmp = self.find('.ui-textbox-label .fa');
				if (tmp.length)
					tmp.rclass2('fa-').aclass('fa-' + value);
				else
					redraw = true;
				break;
			case 'icon2':
			case 'increment':
				redraw = true;
				break;
			case 'labeltype':
				redraw = true;
				break;
		}

		redraw && setTimeout2('redraw.' + self.id, function() {
			self.redraw();
			self.refresh();
		}, 100);
	};

	self.formatter(function(path, value) {
		if (value) {
			switch (config.type) {
				case 'lower':
					value = value.toString().toLowerCase();
					break;
				case 'upper':
					value = value.toString().toUpperCase();
					break;
			}
		}
		return config.type === 'date' ? (value ? value.format(config.format || 'yyyy-MM-dd') : value) : value;
	});

	self.parser(function(path, value) {
		if (value) {
			switch (config.type) {
				case 'lower':
					value = value.toLowerCase();
					break;
				case 'upper':
					value = value.toUpperCase();
					break;
			}
		}
		return value ? config.spaces === false ? value.replace(/\s/g, '') : value : value;
	});

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : self.forcedvalidation() ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		self.tclass('ui-textbox-invalid', invalid);
		config.error && self.find('.ui-textbox-helper').tclass('ui-textbox-helper-show', invalid);
	};

	self.forcedvalidation = function() {
		var val = self.get();
		return (self.type === 'phone' || self.type === 'email') && (val != null && (typeof val === 'string' && val.length !== 0));
	};
});

/*DROPDOWN*/
COMPONENT('dropdown', function(self, config) {

	var select, condition, content = null;
	var render = '';
	self.nocompile && self.nocompile();

	self.validate = function(value) {

		if (!config.required || config.disabled)
			return true;

		var type = typeof(value);
		if (type === 'undefined' || type === 'object')
			value = '';
		else
			value = value.toString();

		EMIT('reflow', self.name);

		switch (self.type) {
			case 'currency':
			case 'number':
				return value > 0;
		}

		return value.length > 0;
	};

	self.configure = function(key, value, init) {

		if (init)
			return;

		var redraw = false;

		switch (key) {
			case 'type':
				self.type = value;
				break;
			case 'items':

				if (value instanceof Array) {
					self.bind('', value);
					return;
				}

				var items = [];

				value.split(',').forEach(function(item) {
					item = item.trim().split('|');
					var obj = { id: item[1] == null ? item[0] : item[1], name: item[0] };
					items.push(obj);
				});

				self.bind('', items);
				break;
			case 'if':
				condition = value ? FN(value) : null;
				break;
			case 'required':
				self.tclass('ui-dropdown-required', value === true);
				self.state(1, 1);
				break;
			case 'datasource':
				self.datasource(value, self.bind);
				break;
			case 'label':
				content = value;
				redraw = true;
				break;
			case 'icon':
				redraw = true;
				break;
			case 'disabled':
				self.tclass('ui-disabled', value);
				self.find('select').prop('disabled', value);
				self.reset();
				break;
		}

		redraw && setTimeout2(self.id + '.redraw', 100);
	};

	self.bind = function(path, arr) {

		if (!arr)
			arr = EMPTYARRAY;

		var builder = [];
		var value = self.get();
		var propText = config.text || 'name';
		var propValue = config.value || 'id';

		config.empty !== undefined && builder.push('<option value="">{0}</option>'.format(config.empty));

		var type = typeof(arr[0]);
		var notObj = type === 'string' || type === 'number';

		for (var i = 0, length = arr.length; i < length; i++) {
			var item = arr[i];
			if (condition && !condition(item))
				continue;
			if (notObj)
				builder.push(self.template({ value: item, selected: value == item, text: item }));
			else
				builder.push(self.template({ value: item[propValue], selected: value == item[propValue], text: item[propText] }));
		}

		render = builder.join('');
		select.html(render);
	};

	self.redraw = function() {
		var html = '<div class="ui-dropdown"><select data-jc-bind="">{0}</select></div>'.format(render);
		var builder = [];
		var label = content || config.label;
		if (label) {
			builder.push('<div class="ui-dropdown-label">{0}{1}:</div>'.format(config.icon ? '<span class="fa fa-{0}"></span> '.format(config.icon) : '', label));
			builder.push('<div class="ui-dropdown-values">{0}</div>'.format(html));
			self.html(builder.join(''));
		} else
			self.html(html).aclass('ui-dropdown-values');
		select = self.find('select');
		render && self.refresh();
		config.disabled && self.reconfigure('disabled:true');
		self.tclass('ui-dropdown-required', config.required === true);
                if (config.class) { 
			self.find('.ui-dropdown').rclass('ui-dropdown'); 
                } 
	};

	self.make = function() {
		self.template = Tangular.compile('<option value="{{value}}"{{if selected}} selected="selected"{{ fi }}>{{text}}</option>');
		self.type = config.type;
		content = self.html();
		self.aclass('ui-dropdown-container');
		self.redraw();
		config.if && (condition = FN(config.if));
		config.items && self.reconfigure({ items: config.items });
		config.datasource && self.reconfigure('datasource:' + config.datasource);
	        if (config.class) self.find('select').attr('class', config.class);
	};

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		self.tclass('ui-dropdown-invalid', invalid);
	};
});
/*DROPDOWN*/
/*NOTIFY*/
COMPONENT('notify', 'timeout:3000;position:bottom', function(self, config) {

	var autoclosing;

	self.singleton();
	self.readonly();
	self.nocompile && self.nocompile();
	self.template = Tangular.compile('<div class="ui-notify ui-notify-{{ type }}" data-id="{{ id }}"><div class="ui-notify-icon"><i class="fa {{ icon }}"></i></div><div class="ui-notify-message">{{ message | raw }}</div>');
	self.items = {};

	self.make = function() {

		self.aclass('ui-notify-container');

		self.event('click', '.ui-notify', function() {
			var el = $(this);
			self.close(+el.attrd('id'));
			clearTimeout(autoclosing);
			autoclosing = null;
			self.autoclose();
		});
	};

	self.configure = function(key, value, init) {
		if (key === 'position') {
			var cls = 'ui-notify-container-';
			self.rclass2(cls).aclass(cls + value.replace(/_|\s/, '-'));
		}
	};

	self.close = function(id) {
		var obj = self.items[id];
		if (obj) {
			delete self.items[id];
			var item = self.find('div[data-id="{0}"]'.format(id));
			item.aclass('ui-notify-hide');
			setTimeout(function() {
				item.remove();
			}, 600);
		}
	};


	self.append = function(message, type) {

		if (!type)
			type = 1;

		switch (type) {
			case 'success':
				type = 1;
				break;
			case 'warning':
				type = 2;
				break;
			case 'info':
				type = 3;
				break;
		}

		// type 1: success
		// type 2: warning

		var obj = { id: Math.floor(Math.random() * 100000), message: message, type: type, icon: type === 1 ? 'fa-check-circle' : type === 2 ? 'fa-times-circle' : 'fa-info-circle' };
		self.items[obj.id] = obj;
		self.element.append(self.template(obj));
		self.autoclose();
	};

	self.autoclose = function() {

		if (autoclosing)
			return;

		autoclosing = setTimeout(function() {
			clearTimeout(autoclosing);
			autoclosing = null;
			var el = self.find('.ui-notify');
			el.length > 1 && self.autoclose();
			el.length && self.close(+el.eq(0).attrd('id'));
		}, config.timeout);
	};
});