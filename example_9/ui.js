//Author Senotrusov Alexey, saper639 (04.11.2018)
COMPONENT('airdp', 'languade:ru;position:bottom left;class:form-control;period:30;width:100%',  function(self, config) {
    var html, input, fg = null;  
    self.template = '<input type="text" class={0}>';         
    self.configure = function(key, value, init) {                        
        switch (key) {                        
        }    
    };    
  
    self.redraw = function() {                    
        self.refresh();                 
    };
    //Doc: http://t1m0n.name/air-datepicker/docs/index-ru.html#sub-section-38
    self.select = function(formattedDate, date, inst) {
        self.set(date);         
    };

    self.validate = function(value) {        
       var errtpl = '<span class="help-block"><i class="fa fa-warning"> {0}</span>';
       fg.find('.help-block').remove();
       fg.rclass('has-error');
       if (config.range && value.length < 2) {
            fg.append(errtpl.format('Выберите период'));       
            fg.aclass('has-error');
            return false;
       }              
       return true;
    };        

    self.make = function() {      
        console.log('make');                          
        html = Tangular.compile(self.template.format(config.class));   
        self.css('width', config.width);     
        self.html(html);        
        input = self.find('input');  
        fg = $(input).closest('.form-group');      
        var opt = {};
        if (config.autoClose) opt.autoClose= true;
        if (config.range) { opt.range = true; opt.multipleDatesSeparator=' - ';}
        if (config.timepicker) opt.timepicker = true;    
        if (config.clearButton) opt.clearButton = true;    
        //Документация http://t1m0n.name/air-datepicker/docs/index-ru.html#opts-timeFormat
        if (config.timeFormat) opt.timeFormat = config.timeFormat;
        //Документация http://t1m0n.name/air-datepicker/docs/index-ru.html#sub-section-9
        if (config.dateFormat) opt.dateFormat = config.dateFormat;
        if (config.language) opt.language = config.language;
        if (config.position) opt.position = config.position;
        if (config.view) opt.view = config.view;
        //choice date and time
        opt.onSelect = self.select;
        self.air = $(input).datepicker(opt);      
        if (!self.get()) {
            if (config.range) {
                var date = [NOW.add('-'+config.period+' day'), NOW];
            };
        } else var date = self.get()||NOW;
        self.air.datepicker().data('datepicker').selectDate(date);
    };    
});