COMPONENT('hello', function(self, config) {
    self.make = function() {
        self.element.text('Hello');
    };
});

COMPONENT('timer', 'format:HH\\\:mm\\\:ss', function(self, config) {
    self.make = function() {
        setInterval(self.timer, 1000);
    };

    self.timer = function() {
        var time = new Date().format(config.format); 
        self.element.text(time);
    };
});

COMPONENT('countdown', function(self, config) {
    var count;
    var timer;

    self.timer = function() {
        count--;
        self.set(count, 3);
        if (count)
            self.element.text('countdown: ' + count);
        else {
            clearInterval(timer);
            self.element.text('countdown: END');
            config.end && EXEC(config.end); // vyvoláme funkciu ak je pri deklarovaní komponenty použitý config `end`
        }
    };

    self.setter = function(value, path, type) {

        if (!value || type === 3)
            return;
        count = value;
        timer && clearInterval(timer);
        timer = setInterval(self.timer, 1000);
        self.timer();
    };
});

COMPONENT('imgview', function(self, config) {
	var select, preview, content = null;
	var render = '';
	//конфигурирование компоненента при его инициализации
	self.configure = function(key, value, init) {
		if (init) return;
		if (key=='datasource') self.datasource(value, self.bind);		
	};	
	self.redraw = function() {		
		var html = '<select data-jc-bind="" size="5" style="width:150px;">{0}</select><span class="preview"></span>'.format(render);		
		self.html(html);
		select = self.find('select');
		preview = self.find('.preview');
		render && self.refresh();			
	};	
	//наблюдает за изменениями в модели в соответствии с опред. path, при выборе в списке меняем аватарку
	self.setter = function(value) {
		if (!value) return;
		var img = self.preview.format(value);
		preview.html(img);
		select.find('option').each(function(el) {
 		    var el = $(this);
                    var is = el.attr('value') === value;
                    el.attr('selected', is);  
                })
	};	
	//привязываем datasource к нашему списку
	self.bind = function(path, arr) {		
		if (!arr) arr = EMPTYARRAY;		
		var builder = [];
		var value = self.get();
		var propText = config.text || 'name';
		var propValue = config.value || 'url';
		for (var i = 0, length = arr.length; i < length; i++) {
			var item = arr[i];			
			builder.push(self.template({ value: item[propValue], selected: value == item[propValue], text: item[propText] }));
		}		
		render = builder.join('');
		select.html(render);
	};	
	//выполняется при создании компонента
	self.make = function() {		
		self.template = Tangular.compile('<option value="{{value}}"{{if selected}} selected="selected"{{ fi }}>{{text}}</option>');
		self.preview = '<img src="{0}" style="width:100px">';
		content = self.html();
		self.redraw();
		config.datasource && self.reconfigure('datasource:' + config.datasource);		
	};	
})	