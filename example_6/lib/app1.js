  var arr_countries = [{id: 'au', name: 'Australia'}, {id: 'be', name: 'Belgium'}, {id: 'br', name: 'Brazil'}, {id: 'cn', name: 'China'},
                      {id: 'de', name: 'Germany'}, {id: 'fr', name: 'France'}, {id: 'gb', name: 'Great Britain'}, {id: 'it', name: 'Italy'},
		      {id: 'jp', name: 'Japan'}, {id: 'ru', name: 'Russia'}, {id: 'si', name: 'Slovenia'}, {id: 'us', name: 'USA'} ];

  var arr_categories = [{id: 'business', name: 'Business'}, {id: 'entertainment', name: 'Entertainment'}, {id: 'general', name: 'General'},
			{id: 'health', name: 'Health'}, {id: 'science', name: 'Science'}, {id: 'sports', name: 'Sports'}, {id: 'technology', name: 'Technology'} ];
  var arr_sortby = [{id: 'relevancy', name: 'Relevancy'}, {id: 'popularity', name: 'Popularity'}, {id: 'publishedAt', name: 'PublishedAt'} ];
  var arr_language = [{id: 'de', name: 'Deutsch'}, {id: 'en', name: 'English'}, {id: 'es', name: 'Español'}, {id: 'fr', name: 'Français'},
		      {id: 'it', name: 'Italiano'}, {id: 'ru', name: 'Русский'}, {id: 'zh', name: '中文'} ];

  var common = { 'pTop': 1, 'pSearch': 1};
  var option = CACHE('option')||{country: 'ru', category:'general', language: 'ru', sortBy: 'publishedAt'};
  var apiKey = '0e1cee0bb93c47768333236ffebcd645';
  var pageSize = 10;
  var tCard = Tangular.compile($('#tCard').html());

  var container = $('#body');
  //меню для маршрутизации
  NAV.clientside('.R');	
  NAV.route('#search', ()=>{
    SET('common.page', 'search');
    var lazy = $('.search_content').is('.row');
    if (!lazy) {  
	lazyload_search(null, $('.search_content'));
    } 
    /*var lazy = $('.search_content').FIND('lazycontent');
    if (!lazy) {
      $('.search_content').append('<div data-jc="lazycontent__null__init:lazyload_search;height:1000px;"></div>');
      COMPILE();	
    }*/
  });
  NAV.route('#top', ()=>{
    SET('common.page', 'top');
    /*$('.top_content').html('');      
    common.pTop = 1;
    console.log(common);
    $('.top_content').append('<div data-jc="lazycontent__null__init:lazyload_top;height:1000px;"></div>');
    COMPILE();	                                                                                          */
  });
  NAV.route('#history', ()=>{
    SET('common.page', 'history');
  });
  NAV.route('#setting', ()=>{
    SET('common.page', 'setting');
  });
  NAV.on('location', function(url) {          
        console.log('location', url);      
  })
  
  WATCH('common.page', (path, value, type)=>{
    console.log(value);	
  })

  function save_option() {
     if (!VALIDATE('option.*')) return; 
     CACHE('option', option, '3 months'); 
     SETTER('notify', 'append', 'Settings successfully saved.');
  }
  function lazyload_search() {
     console.log('lazy search');
     AJAXCACHE('GET https://newsapi.org/v2/everything', { q: option.query||'футбол', language: option.language, apiKey:apiKey, pageSize: pageSize, page: common.pSearch, sortBy: option.sortBy }, (res, err) => {
        if (!res) return;   
        common.pSearch += 1;   	
        var $container = $('.search_content');
        var lazy = ($container.is('.row')) ? true : false;
 	$container.append('<div class="row"></div>');
        $container = $('.search_content .row');
	$container.append(tCard(res));
	$container.imagesLoaded(function(){
	   $container.masonry({
		itemSelector: '.box'
	   });
	});         
        if (!lazy) {  
           $container.after('<div data-jc="lazycontent__null__init:lazyload_search;redraw:lazyload_search;"></div>');
           COMPILE();        
        }
     }, '1 hours');
  }
  /*function lazyload_search(comp) {
     console.log('lazy search');
     AJAXCACHE('GET https://newsapi.org/v2/everything', { q: option.query||'футбол', language: option.language, apiKey:apiKey, pageSize: pageSize, page: common.pSearch, sortBy: option.sortBy }, (res, err) => {
        if (!res) return;      	
        var $container = $(comp.element);
  	$container.append(tCard(res));
        common.pSearch += 1;
	// Masonry + ImagesLoaded	
  	$container.imagesLoaded(function(){
		$container.masonry({
			itemSelector: '.box'
		});
	});         
	//$container.after('<div data-jc="lazycontent__null__init:lazyload_search"></div>');
        //COMPILE();
     }, '1 hours');
  }*/
  function lazyload_top(comp) {
     console.log('lazy top');
     AJAXCACHE('GET https://newsapi.org/v2/top-headlines', { country: option.country, category: option.category, apiKey:apiKey, pageSize: pageSize, page: common.pTop, sortBy: option.sortBy }, (res, err) => {        
        if (!res) return;      
        var $container = $(comp.element);
  	$container.append(tCard(res));
        common.pTop += 1;
	// Masonry + ImagesLoaded
	$container.imagesLoaded(function(){
		$container.masonry({
			itemSelector: '.box',
		});
	});
	//el.after('<div class="lazyload_top"></div>');
    }, '1 hours');
  }

  function apply_filter() {
     common.pSearch = 1;    
     $('.search_content').html('');
     REDIRECT('#search');
     return false;
  }