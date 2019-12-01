exports.install = function() {
	ROUTE('/*', 			  'index');
	ROUTE('/api/news/search', news_search);
	ROUTE('/api/news/top', 	  news_top);
};

function news_search() {
	var self = this;
	self.plain('search');
}

function news_top() {
	var self = this;		
	self.plain('top');
}