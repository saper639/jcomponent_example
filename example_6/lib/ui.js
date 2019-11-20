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

COMPONENT('calendar', 'today:Set today;firstday:0;close:Close;yearselect:true;monthselect:true;yearfrom:-70 years;yearto:5 years', function(self, config) {

	var skip = false;
	var visible = false;
	var touchdiff;
	var startX;

	self.days = EMPTYARRAY;
	self.months = EMPTYARRAY;
	self.months_short = EMPTYARRAY;
	self.years_from;
	self.years_to;

	self.singleton();
	self.readonly();
	self.nocompile && self.nocompile();
	self.click = function() {};

	self.configure = function(key, value) {
		switch (key) {
			case 'days':
				if (value instanceof Array)
					self.days = value;
				else
					self.days = value.split(',').trim();

				for (var i = 0; i < DAYS.length; i++) {
					DAYS[i] = self.days[i];
					self.days[i] = DAYS[i].substring(0, 2).toUpperCase();
				}

				break;

			case 'months':
				if (value instanceof Array)
					self.months = value;
				else
					self.months = value.split(',').trim();

				self.months_short = [];

				for (var i = 0, length = self.months.length; i < length; i++) {
					var m = self.months[i];
					MONTHS[i] = m;
					if (m.length > 4)
						m = m.substring(0, 3) + '.';
					self.months_short.push(m);
				}
				break;

			case 'yearfrom':
				if (value.indexOf('current') !== -1)
					self.years_from = parseInt(new Date().format('yyyy'));
				else
					self.years_from = parseInt(new Date().add(value).format('yyyy'));
				break;

			case 'yearto':
				if (value.indexOf('current') !== -1)
					self.years_to = parseInt(new Date().format('yyyy'));
				else
					self.years_to = parseInt(new Date().add(value).format('yyyy'));
				break;
		}
	};

	function getMonthDays(dt) {

		var m = dt.getMonth();
		var y = dt.getFullYear();

		if (m === -1) {
			m = 11;
			y--;
		}

		return (32 - new Date(y, m, 32).getDate());
	}

	self.calculate = function(year, month, selected) {

		var d = new Date(year, month, 1, 12, 0);
		var output = { header: [], days: [], month: month, year: year };
		var firstDay = config.firstday;
		var firstCount = 0;
		var frm = d.getDay() - firstDay;
		var today = new Date();
		var ty = today.getFullYear();
		var tm = today.getMonth();
		var td = today.getDate();
		var sy = selected ? selected.getFullYear() : -1;
		var sm = selected ? selected.getMonth() : -1;
		var sd = selected ? selected.getDate() : -1;
		var days = getMonthDays(d);

		if (frm < 0)
			frm = 7 + frm;

		while (firstCount++ < 7) {
			output.header.push({ index: firstDay, name: self.days[firstDay] });
			firstDay++;
			if (firstDay > 6)
				firstDay = 0;
		}

		var index = 0;
		var indexEmpty = 0;
		var count = 0;
		var prev = getMonthDays(new Date(year, month - 1, 1, 12, 0)) - frm;
		var cur;

		for (var i = 0; i < days + frm; i++) {

			var obj = { isToday: false, isSelected: false, isEmpty: false, isFuture: false, number: 0, index: ++count };

			if (i >= frm) {
				obj.number = ++index;
				obj.isSelected = sy === year && sm === month && sd === index;
				obj.isToday = ty === year && tm === month && td === index;
				obj.isFuture = ty < year;
				if (!obj.isFuture && year === ty) {
					if (tm < month)
						obj.isFuture = true;
					else if (tm === month)
						obj.isFuture = td < index;
				}

			} else {
				indexEmpty++;
				obj.number = prev + indexEmpty;
				obj.isEmpty = true;
				cur = d.add('-' + indexEmpty + ' days');
			}

			if (!obj.isEmpty)
				cur = d.add(i + ' days');

			obj.month = i >= frm && obj.number <= days ? d.getMonth() : cur.getMonth();
			obj.year = i >= frm && obj.number <= days ? d.getFullYear() : cur.getFullYear();
			obj.date = cur;
			output.days.push(obj);
		}

		indexEmpty = 0;

		for (var i = count; i < 42; i++) {
			var cur = d.add(i + ' days');
			var obj = { isToday: false, isSelected: false, isEmpty: true, isFuture: true, number: ++indexEmpty, index: ++count };
			obj.month = cur.getMonth();
			obj.year = cur.getFullYear();
			obj.date = cur;
			output.days.push(obj);
		}

		return output;
	};

	self.hide = function() {
		if (visible) {
			self.older = null;
			self.aclass('hidden');
			self.rclass('ui-calendar-visible');
			visible = false;
		}
		return self;
	};

	self.toggle = function(el, value, callback, offset) {
		if (self.older === el[0]) {
			!self.hclass('hidden') && self.hide();
		} else {
			self.older = el[0];
			self.show(el, value, callback, offset);
		}
		return self;
	};

	self.show = function(el, value, callback, offset) {

		setTimeout(function() {
			clearTimeout2('calendarhide');
		}, 5);

		if (!el)
			return self.hide();

		var off = el.offset();
		var h = el.innerHeight();
		var l = off.left + (offset || 0);
		var t = off.top + h + 12;
		var s = 250;

		if (l + s > WW) {
			var w = el.innerWidth();
			l = (l + w) - s;
		}

		self.time = (value || new Date()).format('HH:mm:ss');
		self.css({ left: l, top: t });
		self.rclass('hidden');
		self.click = callback;
		self.date(value);
		visible = true;
		self.aclass('ui-calendar-visible', 50);
		return self;
	};

	self.setdate = function(dt) {

		var time = self.time.split(':');

		if (time.length > 1) {
			dt.setHours(+(time[0] || '0'));
			dt.setMinutes(+(time[1] || '0'));
			dt.setSeconds(+(time[2] || '0'));
		}

		if (self.click) {
			if (typeof(self.click) === 'string') {
				SET(self.click, dt);
				CHANGE(self.click, true);
			} else
				self.click(dt);
		}
	};

	self.make = function() {

		self.aclass('ui-calendar hidden');

		var conf = {};

		if (!config.days) {
			conf.days = [];
			for (var i = 0; i < DAYS.length; i++)
				conf.days.push(DAYS[i].substring(0, 2).toUpperCase());
		}

		!config.months && (conf.months = MONTHS);
		self.reconfigure(conf);

		self.event('click', '.ui-calendar-today-a', function() {
			self.setdate(new Date());
			self.hide();
		});

		self.event('click touchend', '.ui-calendar-day', function() {
			if (Date.now() - touchdiff > 500)
				return;
			var arr = this.getAttribute('data-date').split('-');
			var dt = new Date(parseInt(arr[0]), parseInt(arr[1]), parseInt(arr[2]), 12, 0);
			self.find('.ui-calendar-selected').rclass('ui-calendar-selected');
			var el = $(this).aclass('ui-calendar-selected');
			skip = !el.hclass('ui-calendar-disabled');
			self.hide();
			self.setdate(dt);
		});

		self.event('click', '.ui-calendar-header', function(e) {
			e.stopPropagation();
		});

		self.event('change', '.ui-calendar-year', function(e) {

			clearTimeout2('calendarhide');
			e.preventDefault();
			e.stopPropagation();

			var arr = this.getAttribute('data-date').split('-');
			var dt = new Date(parseInt(arr[0]), parseInt(arr[1]), 1, 12, 0);
			dt.setFullYear(this.value);
			self.date(dt, true);
		});

		self.event('change', '.ui-calendar-month', function(e){

			clearTimeout2('calendarhide');
			e.preventDefault();
			e.stopPropagation();

			var arr = this.getAttribute('data-date').split('-');
			var dt = new Date(parseInt(arr[0]), parseInt(arr[1]), 1, 12, 0);
			dt.setMonth(this.value);
			self.date(dt, true);
		});

		self.event('click', 'button', function(e) {

			e.preventDefault();
			e.stopPropagation();

			var arr = this.getAttribute('data-date').split('-');
			var dt = new Date(parseInt(arr[0]), parseInt(arr[1]), 1, 12, 0);
			switch (this.name) {
				case 'prev':
					dt.setMonth(dt.getMonth() - 1);
					break;
				case 'next':
					dt.setMonth(dt.getMonth() + 1);
					break;
			}

			self.date(dt, true);
		});

		self.event('touchstart touchmove', '.ui-calendar-table',function(e){

			e.stopPropagation();
			e.preventDefault();

			var x = e.originalEvent.touches[0].pageX;
			var y = e.originalEvent.touches[0].pageY;

			if (e.type === 'touchstart') {
				startX = x;
				touchdiff = Date.now();
				return;
			}

			var diffX = startX - x;

			if (diffX > 70 || diffX < -70) {
				var arr = $(this).data('date').split('-');
				var dt = new Date(parseInt(arr[0]), parseInt(arr[1]), 1, 12, 0);
				dt.setMonth(dt.getMonth() + (diffX > 50 ? 1 : -1));
				self.date(dt, true);
			}
		});

		$(window).on('scroll click', function() {
			visible && setTimeout2('calendarhide', function() {
				EXEC('$calendar.hide');
			}, 20);
		});

		window.$calendar = self;

		self.on('reflow', function() {
			visible && EXEC('$calendar.hide');
		});
	};

	self.date = function(value, skipday) {

		var clssel = 'ui-calendar-selected';

		if (typeof(value) === 'string')
			value = value.parseDate();

		var year = value == null ? null : value.getFullYear();
		if (year && (year < self.years_from || year > self.years_to))
			return;

		if (!value || isNaN(value.getTime())) {
			self.find('.' + clssel).rclass(clssel);
			value = NOW;
		}

		var empty = !value;

		if (skipday) {
			skipday = false;
			empty = true;
		}

		if (skip) {
			skip = false;
			return;
		}

		if (!value)
			value = NOW = new Date();

		var output = self.calculate(value.getFullYear(), value.getMonth(), value);
		var builder = [];

		for (var i = 0; i < 42; i++) {

			var item = output.days[i];

			if (i % 7 === 0) {
				builder.length && builder.push('</tr>');
				builder.push('<tr>');
			}

			var cls = [];

			item.isEmpty && cls.push('ui-calendar-disabled');
			cls.push('ui-calendar-day');

			!empty && item.isSelected && cls.push(clssel);
			item.isToday && cls.push('ui-calendar-day-today');
			builder.push('<td class="{0}" data-date="{1}-{2}-{3}"><div>{3}</div></td>'.format(cls.join(' '), item.year, item.month, item.number));
		}

		builder.push('</tr>');

		var header = [];
		for (var i = 0; i < 7; i++)
			header.push('<th>{0}</th>'.format(output.header[i].name));

		var years = value.getFullYear();
		if (config.yearselect) {
			years = '';
			var current_year = value.getFullYear();
			for (var i = self.years_from; i <= self.years_to; i++)
				years += '<option value="{0}" {1}>{0}</option>'.format(i, i === current_year ? 'selected' : '');
			years = '<select data-date="{0}-{1}" class="ui-calendar-year">{2}</select>'.format(output.year, output.month, years);
		}

		var months = self.months[value.getMonth()];
		if (config.monthselect) {
			months = '';
			var current_month = value.getMonth();
			for (var i = 0, l = self.months.length; i < l; i++)
				months += '<option value="{0}" {2}>{1}</option>'.format(i, self.months[i], i === current_month ? 'selected' : '');
			months = '<select data-date="{0}-{1}" class="ui-calendar-month">{2}</select>'.format(output.year, output.month, months);
		}

		self.html('<div class="ui-calendar-header"><button class="ui-calendar-header-prev" name="prev" data-date="{0}-{1}"><span class="fa fa-arrow-left"></span></button><div class="ui-calendar-header-info">{2} {3}</div><button class="ui-calendar-header-next" name="next" data-date="{0}-{1}"><span class="fa fa-arrow-right"></span></button></div><div class="ui-calendar-table" data-date="{0}-{1}"><table cellpadding="0" cellspacing="0" border="0"><thead>{4}</thead><tbody>{5}</tbody></table></div>'.format(output.year, output.month, months, years, header.join(''), builder.join('')) + (config.today ? '<div class="ui-calendar-today"><a href="javascript:void(0)">{0}</a><a href="javascript:void(0)" class="ui-calendar-today-a"><i class="fa fa-calendar"></i>{1}</a></div>'.format(config.close, config.today) : ''));
	};
});

COMPONENT('lazyload', 'offset:50', function(self, config) {

	var is = null;
	var container = $(W);

	self.readonly();

	self.configure = function(key, value) {
		if (key === 'container') {
			container.off('scroll', self.refresh);
			container = $(value);
			is = container[0] === W;
			container.on('scroll', self.refresh);
		}
	};

	self.make = function() {
		is = true;
		container.on('scroll', self.refresh);
		setTimeout(self.refresh, 1000);
	};

	self.refresh = function() {
		!self.release() && setTimeout2(self.id, self.prepare, 200);
	};

	self.released = self.refresh;
	self.setter = self.refresh;

	self.prepare = function() {
		var scroll = container.scrollTop();
		var beg = scroll;
		var end = beg + container.height();
        var off = config.offset;
		self.find(config.selector).each(function() {
			if (!this.getAttribute('data-lazyload')) {
				var el = $(this);
				var top = (is ? 0 : scroll) + el.offset().top;
				if ((top + off) >= beg && (top - off) <= end) {
					el.attrd('lazyload', true);
					config.exec && EXEC(config.exec, el);
				}
			}
		});
	};
});

COMPONENT('checkbox', function(self, config) {

	self.nocompile && self.nocompile();

	self.validate = function(value) {
		return (config.disabled || !config.required) ? true : (value === true || value === 'true' || value === 'on');
	};

	self.configure = function(key, value, init) {
		if (init)
			return;
		switch (key) {
			case 'label':
				self.find('span').html(value);
				break;
			case 'required':
				self.find('span').tclass('ui-checkbox-label-required', value);
				break;
			case 'disabled':
				self.tclass('ui-disabled', value);
				break;
			case 'checkicon':
				self.find('i').rclass2('fa-').aclass('fa-' + value);
				break;
		}
	};

	self.make = function() {
		self.aclass('ui-checkbox');
		self.html('<div><i class="fa fa-{2}"></i></div><span{1}>{0}</span>'.format(config.label || self.html(), config.required ? ' class="ui-checkbox-label-required"' : '', config.checkicon || 'check'));
		config.disabled && self.aclass('ui-disabled');
		self.event('click', function() {
			if (config.disabled)
				return;
			self.dirty(false);
			self.getter(!self.get());
		});
	};

	self.setter = function(value) {
		self.tclass('ui-checkbox-checked', !!value);
	};
});

COMPONENT('lazycontent', function(self, config) {

	self.visible_old = 0;
	self.isinit = false;
	self.isredraw = false;

	self.readonly();

	self.init = function() {

		window.$lazycontent = [];
		window.$lazycontent_can = false;

		var win = $(window);
		win.on('scroll', function() {

			if (!window.$lazycontent_can)
				return;

			var arr = window.$lazycontent;
			var top = win.scrollTop();
			var toph = top + win.height();

			for (var i = 0, length = arr.length; i < length; i++) {
				var item = arr[i];
				item.component.visible = toph >= item.top && top <= item.top + item.height;
				!item.remove && item.component.refresh(item);
			}
		});

		window.$lazycontent_refresh = function(skip) {
			setTimeout2('$lazycontent', function() {
				var arr = window.$lazycontent;
				for (var i = 0, length = arr.length; i < length; i++) {
					var item = arr[i];
					if (item.remove)
						continue;
					if (item.component.id !== skip)
						item.top = item.component.element.offset().top;
					if (item.innerh)
						item.height = item.component.element.height();
				}
			}, 200);
		};

		setTimeout(function() {
			win.trigger('scroll');
		}, 500);

		setInterval($lazycontent_refresh(), 1000 * 60);
	};

	self.destroy = function() {
		self.clean();
	};

	self.clean = function() {
		var index = window.$lazycontent.findIndex(function(item) {
			return item.component.id === self.id;
		});
		if (index === -1)
			return;
		window.$lazycontent.splice(index, 1);
		window.$lazycontent_can = window.$lazycontent.length > 0;
	};

	self.refresh = function(item) {

		if (self.visible_old === self.visible)
			return;

		clearTimeout(self.visible_timeout);
		self.visible_old = self.visible;
		setTimeout2(self.id, function() {

			var attr;

			if (self.visible) {
				if (self.isinit) {
					self.isredraw = true;
					attr = 'redraw';
				} else {
					self.isinit = true;
					attr = 'init';
					item.remove = item.$remove;
					setTimeout(function() {
						$lazycontent_refresh(self.id);
					}, 200);
				}
			} else if (self.isinit)
				attr = 'hide';

			if (!attr)
				return;

			var path = config[attr];
			if (!path)
				return;

			var val = self.get(path);
			if (typeof(val) === 'function')
				val.call(self, self);
			else
				self.set(attr === 'hide' ? !self.visible : self.visible);

			if (!self.isinit || !item.remove)
				return;

			self.clean();
		}, 100);
	};

	self.make = function() {
		var self = this;
		var item = {};

		item.component = self;
		item.top = self.element.offset().top;
		item.type = 0;
		item.height = (config.height || '').replace(/px|%/g, '').parseInt();
		item.$remove = !(config.redraw || config.hide);
		item.remove = false;

		if (!item.height) {
			item.innerh = true;
			item.height = self.element.height();
		}

		$lazycontent.push(item);
		$lazycontent_can = true;

		setTimeout2('$lazycontent.refresh', window.$lazycontent_refresh, 200);
	};
});