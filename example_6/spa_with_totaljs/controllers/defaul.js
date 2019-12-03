exports.install = function() {
	ROUTE('/*', 			  'index');
	ROUTE('/api/news/search', news_search);
	ROUTE('/api/news/top', 	  news_top);
};

function news_search() {
	var self = this;	
	MODULE('News').search(self.query, (err, res)=>{
		return self.json((err)? SUCCESS(false) : SUCCESS(true, res));
	})
}

function news_top() {
	var self = this;		
	MODULE('News').top(self.query, (err, res)=>{
		return self.json((err)? SUCCESS(false) : SUCCESS(true, res));
	})
}