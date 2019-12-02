  /*global and options var*/
  var arr_countries = [{id: 'au', name: 'Australia'}, {id: 'be', name: 'Belgium'}, {id: 'br', name: 'Brazil'}, {id: 'cn', name: 'China'},
                      {id: 'de', name: 'Germany'}, {id: 'fr', name: 'France'}, {id: 'gb', name: 'Great Britain'}, {id: 'it', name: 'Italy'},
		      {id: 'jp', name: 'Japan'}, {id: 'ru', name: 'Russia'}, {id: 'si', name: 'Slovenia'}, {id: 'us', name: 'USA'} ];

  var arr_categories = [{id: 'business', name: 'Business'}, {id: 'entertainment', name: 'Entertainment'}, {id: 'general', name: 'General'},
			{id: 'health', name: 'Health'}, {id: 'science', name: 'Science'}, {id: 'sports', name: 'Sports'}, {id: 'technology', name: 'Technology'} ];
  var arr_sortby = [{id: 'relevancy', name: 'Relevancy'}, {id: 'popularity', name: 'Popularity'}, {id: 'publishedAt', name: 'PublishedAt'} ];
  var arr_language = [{id: 'de', name: 'Deutsch'}, {id: 'en', name: 'English'}, {id: 'es', name: 'Español'}, {id: 'fr', name: 'Français'},
		      {id: 'it', name: 'Italiano'}, {id: 'ru', name: 'Русский'}, {id: 'zh', name: '中文'} ];
  var options_default = {country: 'ru', category:'general', language: 'ru', sortBy: 'publishedAt', pageSize: 20};
  //helper for template Engine, get value by id from array
  Thelpers.select = function(value, arr) {
       var res = arr.findItem('id', value);	
       return (res) ? res.name : '';
  };
  //init option from CASHE or use default
  SET('option', CACHE('option')||options_default);
  //init page settings
  SET('common',  { 'pTop': 1, 'pSearch': 1});
  //container where we will place the data
  var container = $('#body');
  //init mini template
  var tCard, tEnd; 	

  //init NAVIGATE
  NAV.clientside('.R');	
  //page search
  NAV.route('/search', ()=>{
    SET('common.page', 'search');
    var lazy = $('.search_content').FIND('lazyload');    
    if (!lazy) {
        setTimeout(()=>{
            $('.search_content').append('<div data-jc="lazyload__null__selector:.lazyload;exec:lazyload_search;"><div class="lazyload"><div class="text-center"><img src="https://componentator.com/img/preloader.gif"></div></div></div>');
            COMPILE();	
        }, 1000);    
    }
  });
  //page top
  NAV.route('/top', ()=>{
    SET('common.page', 'top');
    $('.top_content').html('');      
    SET('common.pTop', 1);    
    var lazy = $('.top_content').FIND('lazyload');	    
    if (!lazy) {
        setTimeout(()=>{
            $('.top_content').append('<div data-jc="lazyload__null__selector:.lazyload;exec:lazyload_top;"><div class="lazyload"><div class="text-center"><img src="https://componentator.com/img/preloader.gif"></div></div></div>');
            COMPILE();	
        }, 1000);            
    }      
  });
  //page history
  NAV.route('/history', ()=>{
    SET('common.page', 'history');
    SET('common.history', CACHE('history'))
  });

  NAV.route('/setting', ()=>{
    SET('common.page', 'setting');
  });
  function lazyload_search(el) {
     var query = { q: option.query||'футбол', language: option.language, pageSize: option.pageSize, page: common.pSearch, sortBy: option.sortBy };
     if (option.use_date) {
         query.from = option.from.toISOString();
         query.to = option.to.toISOString();
     }
     AJAX('GET api/news/search', query, (res, err)=>{
          
     })
  };
  function lazyload_top(el) {
      console.log('lazy top');
      var query = { language: option.language, category: option.category, pageSize: option.pageSize, page: common.pTop, sortBy: option.sortBy };
      AJAX('GET api/news/top', query, (res, err)=>{
          
      })
  };
  //save option
  function save_option() {
    if (!VALIDATE('option.*')) return; 
    CACHE('option', option, '3 months'); 
    SETTER('notify', 'append', 'Settings successfully saved.');
  };
  //use filter button
  function apply_filter() {
     SET('common.pSearch', 1);
     $('.search_content').html('');
     CACHE('option', option, '3 months'); 
     REDIRECT('/search');
     return false;
  };
  //new view, save data in cache
  function url_view(e) {
    var item = {
        'url':         $(e).attr('href'),
        'title':       $(e).attr('data-title'),
        'description': $(e).attr('data-description'),
        'thumb':       $(e).attr('data-imgurl'),
        'dt':          NOW 
    };
    var history = CACHE('history')||[];
    history.unshift(item); 
    if (history.length > 100) history.pop();
    CACHE('history', history, '3 months');
    return false;
  };
  function initTemplate() {      
      tCard = Tangular.compile($('#tCard').html());
      tEnd = Tangular.compile($('#tEnd').html()); 
  };
