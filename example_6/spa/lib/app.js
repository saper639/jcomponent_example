  /*global and options var*/
  var arr_countries = [{id: 'au', name: 'Australia'}, {id: 'be', name: 'Belgium'}, {id: 'br', name: 'Brazil'}, {id: 'cn', name: 'China'},
                      {id: 'de', name: 'Germany'}, {id: 'fr', name: 'France'}, {id: 'gb', name: 'Great Britain'}, {id: 'it', name: 'Italy'},
		      {id: 'jp', name: 'Japan'}, {id: 'ru', name: 'Russia'}, {id: 'si', name: 'Slovenia'}, {id: 'us', name: 'USA'} ];

  var arr_categories = [{id: 'business', name: 'Business'}, {id: 'entertainment', name: 'Entertainment'}, {id: 'general', name: 'General'},
			{id: 'health', name: 'Health'}, {id: 'science', name: 'Science'}, {id: 'sports', name: 'Sports'}, {id: 'technology', name: 'Technology'} ];
  var arr_sortby = [{id: 'relevancy', name: 'Relevancy'}, {id: 'popularity', name: 'Popularity'}, {id: 'publishedAt', name: 'PublishedAt'} ];
  var arr_language = [{id: 'de', name: 'Deutsch'}, {id: 'en', name: 'English'}, {id: 'es', name: 'Español'}, {id: 'fr', name: 'Français'},
		      {id: 'it', name: 'Italiano'}, {id: 'ru', name: 'Русский'}, {id: 'zh', name: '中文'} ];

  var common = { 'pTop': 1, 'pSearch': 1};
  SET('option', CACHE('option')||{country: 'ru', category:'general', language: 'ru', sortBy: 'publishedAt'});
  var apiKey = '0e1cee0bb93c47768333236ffebcd645';
  var pageSize = 20;
  var tCard = Tangular.compile($('#tCard').html());
  var tEnd = Tangular.compile($('#tEnd').html()); 	

   Thelpers.select = function(value, arr) {
       var res = arr.findItem('id', value);	
       return (res) ? res.name : '';
   };

  var container = $('#body');
  //init spa route
  NAV.clientside('.R');	
 //NAV.hashtags = true;
  //route search
  NAV.route('#search', ()=>{
    SET('common.page', 'search');
    var lazy = $('.search_content').FIND('lazyload');
    if (!lazy) {
      $('.search_content').append('<div data-jc="lazyload__null__selector:.lazyload;exec:lazyload_search;"><div class="lazyload"><div class="text-center"><img src="https://componentator.com/img/preloader.gif"></div></div></div>');
      COMPILE();	
    }
  });
  //route top
  NAV.route('#top', ()=>{
    SET('common.page', 'top');
    $('.top_content').html('');      
    SET('common.pTop', 1);
    var lazy = $('.top_content').FIND('lazyload');	
    if (!lazy) {
	$('.top_content').append('<div data-jc="lazyload__null__selector:.lazyload;exec:lazyload_top;"><div class="lazyload"><div class="text-center"><img src="https://componentator.com/img/preloader.gif"></div></div></div>');
	COMPILE();	
    }  
  });
  //route history
  NAV.route('#history', ()=>{
    SET('common.page', 'history');
    SET('common.history', CACHE('history'))
  });
  //route setting
  NAV.route('#setting', ()=>{
    SET('common.page', 'setting');
  });
  NAV.route('#view', ()=>{
    SET('common.page', 'view');
  });
  //event on location
  NAV.on('location', function(url) {          
        console.log('location', url);      
  })
  
  /*WATCH('common.page', (path, value, type)=>{
    console.log(value);	
  })*/
  //save option
  function save_option() {
     if (!VALIDATE('option.*')) return; 
     console.log(option); 
     CACHE('option', option, '3 months'); 
     SETTER('notify', 'append', 'Settings successfully saved.');
  }
  //lazyload for search page
  function lazyload_search(el) {
     console.log('lazy search'); 
     var query = { q: option.query||'футбол', language: option.language, apiKey:apiKey, pageSize: pageSize, page: common.pSearch, sortBy: option.sortBy };
     if (option.use_date) {
         query.from = option.from.toISOString();
         query.to = option.to.toISOString();
     }
     AJAXCACHE('GET https://newsapi.org/v2/everything', query, (res, isFromCache) => {

 	if (!res.status || res.status=='error') {
	     $(el).html(tEnd());
	     return;	
	};

  	$(el).html(tCard(res));

        INC('common.pSearch', 1);
        var $container = $(el);
	// Masonry + ImagesLoaded	
  	$container.imagesLoaded(function(){
	      $container.masonry({
	    	   itemSelector: '.item'
	      });
	      el.after('<div class="lazyload"><div class="text-center"><img src="https://componentator.com/img/preloader.gif"></div></div>');
	});         
     }, '5 hours');
  }
  //lazyload for top page
  function lazyload_top(el) {
     console.log('lazy top', common); 
     AJAXCACHE('GET https://newsapi.org/v2/top-headlines', { 
		country: option.country, 
		category: option.category, 
		apiKey:apiKey, 
		pageSize: pageSize, 
		page: common.pTop, 
		sortBy: option.sortBy }, (res, err) => {        
 	if (!res.status || res.status=='error') {
	     $(el).html(tEnd());
	     return;	
	};
  	$(el).html(tCard(res));
        INC('common.pTop', 1);
        var $container = $(el);
	// Masonry + ImagesLoaded
	$container.imagesLoaded(function(){
	      $container.masonry({
		itemSelector: '.item',
	      });
	      el.after('<div class="lazyload"><div class="text-center"><img src="https://componentator.com/img/preloader.gif"></div></div>');
	});
    }, '5 hours');
  }
  //button apply
  function apply_filter() {
     SET('common.pSearch', 1);
     $('.search_content').html('');
     CACHE('option', option, '3 months'); 
     REDIRECT('#search');
     return false;
  }
  //view news
  function url_view(e) {
    var item = {
	'url': $(e).attr('href'),
	'title': $(e).attr('data-title'),
	'description': $(e).attr('data-description'),
	'thumb': $(e).attr('data-imgurl'),
        'dt': NOW 
    };
    var history = CACHE('history')||[];
    history.unshift(item); 
    if (history.length > 100) history.pop();
    CACHE('history', history, '3 months');
    //SET('common.url', $(e).attr('data-url'));
    //REDIRECT('#view')
    return false;
  }