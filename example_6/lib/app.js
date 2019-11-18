function view_search() {
  console.log('search');
  $('#body').html("<h1>Search</h1>");	
};

function view_top() {
  console.log('top');
  $('#body').html("<h1>Top</h1>");	
};

function view_history() {
  console.log('history');
  $('#body').html("<h1>History</h1>");	
};

function view_setting() {
  console.log('setting');
  $('#body').html("<h1>Setting</h1>");	
};

function active_url(url){
 	var nav = $('nav');
	nav.find('.active').removeClass('active');
	nav.find('[href="' + url + '"]').parent().addClass('active');
}

var page;

$(function() { 
  var container = $('#body');
  var pages = ['search', 'top', 'history', 'setting'];
  //меню для маршрутизации
  NAV.clientside('.jrouting');	
  NAV.route('#search', view_search);
  NAV.route('#top', view_top);
  NAV.route('#history', view_history);
  NAV.route('#setting', view_setting);
  NAV.on('location', function(url) {          
        console.log('location', url);  
        var new_page = url.slice(1);
        if (pages.includes(new_page)) {
            page = new_page;
            //menu active
            active_url(url);
        };
  })
})