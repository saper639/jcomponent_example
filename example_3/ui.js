COMPONENT('imgview', function(self, config) {
	var selectm, content = null;
	var render = '';
	self.configure = function(key, value, init) {
	};	
	self.redraw = function() {
		console.log('yes2');
		var html = '<select data-jc-bind="">{0}</select>'.format(render);
		self.html(html);
		select = self.find('select');
		render && self.refresh();
	};	
	self.make = function() {
		console.log('yes');
		self.template = Tangular.compile('<option value="{{value}}"{{if selected}} selected="selected"{{ fi }}>{{text}}</option>');
		content = self.html();
		self.redraw();
	};	
})	