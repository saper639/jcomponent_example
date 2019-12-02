exports.name = "News";
var apiKey = '0e1cee0bb93c47768333236ffebcd645';

exports.search = function (param, cb) {
	var url = 'https://newsapi.org/v2/everything';
	query(url, param, (err, res) => {
		return cb(null, {});
	})	
}	

exports.top = function (param, cb) {
	var url = 'https://newsapi.org/v2/top-headlines';
	query(url, param, (err, res) => {
		return cb(null, {});
	})	
}	

function query(url, param, cb)  {
	param.apiKey = apiKey;
	RESTBuilder.make(function(builder) {
		builder.url(url);
		builder.get(param);
		builder.cache('1 hours');
		builder.exec(function(err, resp) {
			console.log(resp);
       		return cb(null, {});	
    	});
	})	
}