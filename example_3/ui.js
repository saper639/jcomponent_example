COMPONENT('hello', function(self, config) {
    //после инициализации запустится делегат make
    self.make = function() {
        //Среди свойств у нас есть self.element, который возвращает   
        //элемент jQuery. Он содержит элемент нашей декларации.
        self.element.text('Hello');
    };
});

COMPONENT('timer', 'format:HH\\\:mm\\\:ss', function(self, config) {
    self.make = function() {
	//каждую секунду вызывается функция self.timer()
        setInterval(self.timer, 1000);
    };

    self.timer = function() {
	//определяем текущее время
        var time = new Date().format(config.format); 
	//выведем время
        self.element.text(time);
    };
});

COMPONENT('countdown', function(self, config) {
    var count;
    var timer;

    self.timer = function() {
	//уменьшаем значение счётчика    
        count--;
	//сохраним текущее значение, вызовется self.setter()
        self.set(count, 3);
	//если значение > 0, выведем значение
        if (count)
            self.element.text('countdown: ' + count);
	//иначе, счётчик завершил отсчёт    
        else {
            clearInterval(timer);
            self.element.text('countdown: END');
	    //вызовем функцию, которая указана в параметре end
            config.end && EXEC(config.end);
        }
    };
    //вызывается при изменении значения
    self.setter = function(value, path, type) {
	//если значение не существует или оно задано по умолчанию,   
        //то прервем выполенение
        if (!value || type === 3)
            return;
	//каждую секунду запускаем обновление счётчика
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
                    //выделим текущий url в списке аватарок
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