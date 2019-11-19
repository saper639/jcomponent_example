var common = {};
var container = $('#body');
  //меню для маршрутизации
  NAV.clientside('.R');	
  NAV.route('#search', ()=>{
    SET('common.page', 'search');
  });
  NAV.route('#top', ()=>{
    SET('common.page', 'top');
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