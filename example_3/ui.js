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