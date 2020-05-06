//Author Senotrusov Alexey, saper639 (04.11.2018)
COMPONENT('dt', function(self, config) {
    function prepare() {               
        var view = config.view || 'full'; 
        if (config.detail) {
            self.meta.detail = Tangular.compile($(config.detail).html());            
        } 
        var opt_main = CLONE(options[view]);         
        //additional options
        if (self.meta.option)  Object.assign(opt_main, self.meta.option);                   
        //ajax seeting for use in table
        if (self.meta.ajax) { 
            Object.assign(opt_main, {'ajax': self.meta.ajax});                   
            //ajax.url = config.ajax;            
            //opt_main.ajax = ajax;
            //opt_main.processing = true;
            //opt_main.serverSide = true;
        } else {
            opt_main.data = self.get()||[];            
        } 
        //settings render && ajax
        var opt_dop = MAKE(function(obj) {                        
            this.columns = [];
            //settings for render data in table  
            self.meta.fields.forEach((item)=> {   
                if (item.col && item.col.tpl) { 
                    item.col.tpl = Ta.compile($(item.col.tpl).html());                                
                    item.col.render = function(data, type, row) { return item.col.tpl(row) };                    
                } else if (item.col && item.col.render) {                      
                    item.col.render = Function('data, type, row, meta', item.col.render);                       
                };  
                this.columns.push(item.col);
            });
            //ajax
            /*if (self.meta.ajax) {                
                self.ajax = self.meta.ajax;                                
            }   */
        });
        //setting callback        
        var cb = MAKE(function(obj) {                                         
            obj.initComplete = function(settings, json) {         
                setTimeout(()=>{
                   COMPILE();
                   if (self.meta.cb && meta.cb['initComplete']) eval(self.meta.cb['initComplete']);               
                   $('.dataTables_filter input').attr('placeholder', 'Фильтр...');
                }, 300)
            };
            obj.drawCallback = function(settings) {                
                COMPILE();
                if (config.view == 'mini') self.mini();                     
                if (self.meta.cb && meta.cb['drawCallback']) eval(self.meta.cb['drawCallback']);               
            };
            obj.createdRow = function(row, data, dataIndex) {                                                
                if (self.meta.cb && self.meta.cb['createdRow']) eval(self.meta.cb['createdRow']);               
            };            
        });                      

        Object.assign(opt_main, opt_dop, cb);           
        console.log(opt_main);
        return opt_main;
    }   
    //template for fields
    self.template = Tangular.compile('<th width="{{size}}">{{title|raw}}</th>');
    //make
    self.make = function() {           
        self.append('<table cellspacing="0" width="100%"><thead><tr></tr></thead></table>');         
        //configuration is hosted on server
        if (config.url) {
            return;
        }   
        //configuration is placed inside script
        var resp = self.find('script').html();            
        if (typeof(resp) == 'string') {
            resp = new Function('return ' + resp.trim())();
            self.init(resp);
        }    
    }  

    self.resize = function(th) {                    
        th = th||90;                                
        var scr_h=$(meta.htmlId+'_wrapper').parent().parent().outerHeight()-th;             
        $(meta.htmlId+'_wrapper .dataTables_scroll').height(scr_h+'px');
        var ph_h= (config.view == 'mini') ? 0 : $(meta.htmlId+'_wrapper .dataTables_paginate').height();
        $(meta.htmlId+'_wrapper .dataTables_scrollBody').css({'max-height':scr_h - ph_h+'px'});              
        self.dt.draw(true);        
    };   

    self.mini = function() {
        $(meta.htmlId+'_wrapper .pagination').addClass('pagination-sm');
    };  

    self.detailCollapse = function(e) { 
        console.log('detail collapse');
        var tr = $(e).closest('tr');
        var row = self.dt.row( tr );            
        if ( row.child.isShown() ) {            
            row.child.hide();
            tr.removeClass('shown');
        }
        else {      
            row.child( meta.detail(row.data()) ).show();
            tr.addClass('shown');        
        }           
        COMPILE();
    };      
    //add row
    self.add = function(data) { 
        data = Array.isArray(data) ? data : [data];
        data.forEach((item)=>{
            self.dt.row.add(item);
        });
        self.dt.draw(false);        
    };
    //update row
    self.update = function(data, id) { 
        data = Array.isArray(data) ? data : [data];
        data.forEach((item)=>{
            self.dt.row((idx, row) => {
                return (row[id] == item[id]);
            }).data(item);             
        });
        self.dt.draw(false);        
    };      
    //delete row
    self.delete = function(data, id) { 
        data = Array.isArray(data) ? data : [data];
        data.forEach((item)=>{
            self.dt.row((idx, row) => {
                //console.log('data-'+row[id], 'src-'+item[id]);
                return (row[id] == item[id]);
            }).remove();             
        });
        self.dt.draw(false);        
    };      
    //refresh
    self.draw = function(data) { 
        self.dt.clear();         
        self.dt.rows.add(_.isArray(data) ? data : []);          
        self.dt.draw(true);        
    };
    //setter
    self.setter = function(value, path, type) {                           
        if (self.ajax) return;
        self.dt.clear();
        self.dt.rows.add(Array.isArray(value) ? value : []);     
        self.dt.draw(false);             
    }
    /**
     * init table
     */
    self.init = function(meta) {        
        var builder = [];   
        if (!meta) return; 
        meta.htmlName = config.name||'tbl'+value.name;                        
        meta.htmlId = '#'+(config.name||'tbl'+value.name);                                

/*        meta.htmlName = GUID();          //??              
        meta.htmlId = '#'+meta.htmlName;      //??
*/      var table = self.find('table');                                  
        meta.style && table.aclass(meta.style);        
        meta.htmlName && table.attr('id', meta.htmlName);
        var container = self.find('thead tr');                                
        //render fields
        meta.fields.forEach((f) => {            
            var item = { title: f.title, size: f.size||'auto' };            
            builder.push(self.template(item));
        });  
        self.meta = meta;       
        container.append(builder.join(''));                           
        self.dt = $(meta.htmlId).DataTable(prepare());     

        //if (config.click) $(self.meta.htmlId+' tbody').on('click', 'tr', (e) => EXEC(config.click, e, self));
        //if (config.detail) $(self.meta.htmlId+' tbody').on('click', 'td.details-control', (e) => self.detailCollapse(e.target));                   
        if (config.details) $(self.meta.htmlId+' tbody').on('click', 'td.details-control', (e) => { console.log('yes'); });                   
   
    }   
    //optios for other type table
    var options = {                
         mini : {
          lengthMenu: [5, 10, 20, 30, 50],
          pageLength: 20, 
          pagingType: 'simple',                  
          language: { "url": "/app/plugins/dt/lang/ru_sm_small.txt" },                
          dom: "<'row'<'col-sm-2'l><'col-sm-5'f><'col-sm-5 text-right'i p>>"+"<'row'<'col-sm-12'tr>>",          
          stateSave:      true,
          deferRender:    true,                       
          scrollY:        300,
          scrollCollapse: true          
        },
        full : {
          lengthMenu: [5, 10, 20, 30, 50],       
          pageLength: 10, 
          /*pagingType: 'full_numbers',         */
          dom: "<'row'<'col-sm-2'l><'col-sm-4'B><'col-sm-6'f>>" +"<'row'<'col-sm-12'tr>>" +"<'row'<'col-sm-5'i><'col-sm-7 text-right'p>>",
          buttons: [
            /*{
                extend:    'copyHtml5',
                text:      '<i class="fa fa-files-o fa-lg"></i>',
                titleAttr: 'Копировать в буфер'
            },*/
            {
                extend:    'print',
                text:      '<i class="fa fa-print fa-lg"></i>',
                titleAttr: 'Печать'
            },
            /*{
                extend:    'excel',
                text:      '<i class="fa fa-file-excel-o fa-lg"></i>',
                titleAttr: 'Excel'
            },
            {
                extend:    'pdf',
                text:      '<i class="fa fa-file-pdf-o fa-lg"></i>',
                titleAttr: 'Pdf'
            },*/
            {
                extend:    'colvis',
                text:      '<i class="fa fa-columns fa-lg" ></i>',
                titleAttr: 'Видимость'
            },
           ],          
          /*language: { "url": "/app/plugins/dt/lang/ru_sm.txt" },                */
          stateSave:      true,          
          deferRender:    true,                                
        }
    }   
})  
//Author Senotrusov Alexey, saper639 (04.11.2018)
//Bootstrap table
/*BOOTSTRAP TABLE*/
COMPONENT('btt', 'locale:ru-RU;export:true;pagination:true', function(self, config) {
    self.prepare = function(meta) {              
        var icons = {               
            refresh: 'fa-sync',
            autoRefresh: 'fa-history',
            fullscreen: 'fa-arrows-alt',            
            columns: 'fa-th-list',                
            export: 'fa-floppy-o',
            print: 'fa-print'                
        }; 
        meta.locale = config.locale;
        meta.pagination = config.pagination;
        //meta.searchAlign = 'left';
       	//meta.buttonsAlign = 'left';        				
        meta.sidePagination = (meta.url || meta.ajax) ? 'server' : 'client';
        meta.iconsPrefix = 'fa';
        meta.icons = icons;                
        meta.columns.forEach((item)=> {   
            if (item.tpl) {             	
                item.tpl = Ta.compile($(item.tpl).html());                                   
                item.formatter = function(value, row, index) { return item.tpl(row) }; 
                //для печати
                if (item.ptpl) {
                    item.ptpl = Ta.compile($(item.ptpl).html());                                
                    item.printFormatter = function(value, row, index) { return item.ptpl(row) };                     
                }                   
            } else if (item.render) {                         
                item.formatter = Function('val, row, index', item.render);                       
              }              
            //сортировка по дате  
            if (item.sorterDate) {
                item.sorter = function(a, b) {
                    if (new Date(a) < new Date(b)) return 1;
                    if (new Date(a) > new Date(b)) return -1;
                    return 0
                } 
            }            
        });    

        //meta.buttonsClass = 'primary';                
        if (config.export) { 
        	meta.showExport = config.export;
        	meta.exportTypes = ['csv', 'txt', 'excel'];
        }	

        if (meta.exportOptions) {            
            meta.exportOptions.onCellHtmlData = eval(meta.exportOptions.onCellHtmlData);            
        };  

        if (meta.queryParams) {            
            meta.queryParams = eval(meta.queryParams);            
        };
        if (meta.cookieCustomStorageGet) {            
            meta.cookieCustomStorageGet = eval(meta.cookieCustomStorageGet);            
        };
        if (meta.cookieCustomStorageSet) {            
            meta.cookieCustomStorageSet = eval(meta.cookieCustomStorageSet);            
        };        
        if (meta.ajax) {            
            meta.ajax = eval(meta.ajax);            
        };
        if (meta.cookie) {
        	meta.cookieIdTable = config.name;
        }  
        self.meta = meta;
    };    

    self.setter = function(value, path, type) {
        self.grid.bootstrapTable('load', value||[]);                
    };

    self.updateRow = function(data, index) {
    	var obj = {index: index, row: data};
    	self.grid.bootstrapTable('updateRow', obj);                	
    };

    self.refresh = function() {    	
    	self.grid.bootstrapTable('refresh');                	
    };

    self.hideColumn = function(name) {    	
    	self.grid.bootstrapTable('hideColumn', name);                	
    };

    self.make = function() {        
        var meta = self.find('script').html();           
        self.html('<table></table>');        
        if (typeof(meta) == 'string') {
            meta = new Function('return ' + meta.trim())();            
        }                 
        if (!meta) return;
        self.prepare(meta);        
        self.grid = self.find('table');  
        setTimeout(()=>{
        	$(self.grid).bootstrapTable(self.meta); 
        	if (config.init) EXEC(config.init);        	
        }, 100)        
    }
})    
/*checkbox*/
COMPONENT('checkbox', function(self, config) {

    self.nocompile && self.nocompile();

    self.validate = function(value) {
        return (config.disabled || !config.required) ? true : (value === true || value === 'true' || value === 'on');
    };

    self.configure = function(key, value, init) {
        if (init)
            return;
        switch (key) {
            case 'label':
                self.find('span').html(value);
                break;
            case 'required':
                self.find('span').tclass('ui-checkbox-label-required', value);
                break;
            case 'disabled':
                self.tclass('ui-disabled', value);
                break;
            case 'checkicon':
                self.find('i').rclass2('fa-').aclass('fa-' + value);
                break;
        }
    };

    self.make = function() {
        self.aclass('ui-checkbox');
        self.html('<div><i class="fa fa-{2}"></i></div><span{1}>{0}</span>'.format(config.label || self.html(), config.required ? ' class="ui-checkbox-label-required"' : '', config.checkicon || 'check'));
        config.disabled && self.aclass('ui-disabled');
        self.event('click', function() {
            if (config.disabled)
                return;
            self.dirty(false);
            self.getter(!self.get());
        });
    };

    self.setter = function(value) {
        self.tclass('ui-checkbox-checked', !!value);
    };
});
//click
COMPONENT('click', function(self, config) {

    self.readonly();

    self.click = function() {
        if (config.disabled)
            return;
        if (config.value)
            self.set(self.parser(config.value));
        else
            self.get(self.attrd('jc-path'))(self);
    };

    self.make = function() {
        self.event('click', self.click);
        config.enter && $(config.enter === '?' ? self.scope : config.enter).on('keydown', 'input', function(e) {
            e.which === 13 && setTimeout(function() {
                !self.element[0].disabled && self.click();
            }, 100);
        });
    };
});
/*==============================================================
  == j-Table ===================================================
  ==============================================================*/
COMPONENT('table', 'highlight:true;unhighlight:true;multiple:false;pk:id;visibleY:1;scrollbar:0;pluralizepages:# pages,# page,# pages,# pages;pluralizeitems:# items,# item,# items,# items;margin:0', function(self, config) {

    var cls = 'ui-table';
    var cls2 = '.' + cls;
    var etable, ebody, eempty, ehead, eheadsize, efooter, container;
    var opt = { selected: [] };
    var templates = {};
    var sizes = {};
    var names = {};
    var aligns = {};
    var sorts = {};
    var dcompile = false;
    var prevsort;
    var prevhead;
    var extradata;

    self.readonly();
    self.nocompile();
    self.bindvisible();

    self.make = function() {

        self.aclass(cls + ' invisible' + (config.detail ? (' ' + cls + '-detailed') : '') + ((config.highlight || config.click || config.exec) ? (' ' + cls + '-selectable') : '') + (config.border ? (' ' + cls + '-border') : ''));

        self.find('script').each(function() {

            var el = $(this);
            var type = el.attrd('type');

            switch (type) {
                case 'detail':
                    var h = el.html();
                    dcompile = h.COMPILABLE();
                    templates.detail = Tangular.compile(h);
                    return;
                case 'empty':
                    templates.empty = el.html();
                    return;
            }

            var display = (el.attrd('display') || '').toLowerCase();
            var template = Tangular.compile(el.html());
            var size = (el.attrd('size') || '').split(',');
            var name = (el.attrd('head') || '').split(',');
            var align = (el.attrd('align') || '').split(',');
            var sort = (el.attrd('sort') || '').split(',');
            var i;

            for (i = 0; i < align.length; i++) {
                switch (align[i].trim()) {
                    case '0':
                        align[i] = 'left';
                        break;
                    case '1':
                        align[i] = 'center';
                        break;
                    case '2':
                        align[i] = 'right';
                        break;
                }
            }

            display = (display || '').split(',').trim();

            for (i = 0; i < align.length; i++)
                align[i] = align[i].trim();

            for (i = 0; i < size.length; i++)
                size[i] = size[i].trim().toLowerCase();

            for (i = 0; i < sort.length; i++)
                sort[i] = sort[i].trim();

            for (i = 0; i < name.length; i++) {
                name[i] = name[i].trim().replace(/'[a-z-\s]+'/, function(val) {
                    if (val.indexOf(' ') === -1)
                        val = val + ' fa';
                    return '<i class="fa-{0}"></i>'.format(val.replace(/'/g, ''));
                });
            }

            if (!size[0] && size.length === 1)
                size = EMPTYARRAY;

            if (!align[0] && align.length === 1)
                align = EMPTYARRAY;

            if (!name[0] && name.length === 1)
                name = EMPTYARRAY;

            if (display.length) {
                for (i = 0; i < display.length; i++) {
                    templates[display[i]] = template;
                    sizes[display[i]] = size.length ? size : null;
                    names[display[i]] = name.length ? name : null;
                    aligns[display[i]] = align.length ? align : null;
                    sorts[display[i]] = sort.length ? sort : null;
                }
            } else {
                templates.lg = templates.md = templates.sm = templates.xs = template;
                sizes.lg = sizes.md = sizes.sm = sizes.xs = size.length ? size : null;
                names.lg = names.md = names.sm = names.xs = name.length ? name : null;
                sorts.lg = sorts.md = sorts.sm = sorts.xs = sort.length ? sort : null;
                aligns.lg = aligns.md = aligns.sm = aligns.xs = align.length ? align : null;
            }
        });

        self.html('<div class="{0}-headcontainer"><table class="{0}-head"><thead></thead></table></div><div class="{0}-container"><table class="{0}-table"><thead></thead><tbody class="{0}-tbody"></tbody></table><div class="{0}-empty hidden"></div></div>'.format(cls));
        etable = self.find(cls2 + '-table');
        ebody = etable.find('tbody');
        eempty = self.find(cls2 + '-empty').html(templates.empty || '');
        ehead = self.find(cls2 + '-head thead');
        eheadsize = etable.find('thead');
        container = self.find(cls2 + '-container');

        etable.on('click', 'button', function() {
            if (config.click) {
                var btn = $(this);
                var row = opt.items[+btn.closest('tr').attrd('index')];
                SEEX(self.makepath(config.click), btn[0].name, row, btn);
            }
        });

        if (config.paginate) {
            self.append('<div class="{0}-footer"><div class={0}-pagination-items hidden-xs"></div><div class="{0}-pagination"><button name="page-first" disabled><i class="fa fa-angle-double-left"></i></button><button name="page-prev" disabled><i class="fa fa-angle-left"></i></button><div><input type="text" name="page" maxlength="5" class="{0}-pagination-input" /></div><button name="page-next" disabled><i class="fa fa-angle-right"></i></button><button name="page-last" disabled><i class="fa fa-angle-double-right"></i></button></div><div class="{0}-pagination-pages"></div></div>'.format(cls));
            efooter = self.find(cls2 + '-footer');

            efooter.on('change', cls2 + '-pagination-input', function() {

                var value = self.get();
                var val = +this.value;

                if (isNaN(val))
                    return;

                if (val >= value.pages)
                    val = value.pages;
                else if (val < 1)
                    val = 1;

                value.page = val;
            });

            efooter.on('click', 'button', function() {
                var data = self.get();

                var model = {};
                model.page = data.page;
                model.limit = data.limit;

                if (prevsort)
                    model.sort = prevsort && prevsort.type ? (prevsort.name + '_' + prevsort.type) : '';

                switch (this.name) {
                    case 'page-first':
                        model.page = 1;
                        SEEX(self.makepath(config.paginate), model);
                        break;
                    case 'page-last':
			model.page = data.pages;
                        SEEX(self.makepath(config.paginate), model);
                        break;
                    case 'page-prev':
                        model.page -= 1;
                        SEEX(self.makepath(config.paginate), model);
                        break;
                    case 'page-next':
                        model.page += 1;
                        SEEX(self.makepath(config.paginate), model);
                        break;
                }
            });
        }

        if (config.scrollbar) {
            self.scrollbar = SCROLLBAR(container, { visibleY: !!config.visibleY });
            ehead.parent().parent().aclass(cls + '-scrollbar');
        }

        templates.empty && templates.empty.COMPILABLE() && COMPILE(eempty);

        self.event('click', '.sort', function() {

            var th = $(this);
            var i = th.find('i');
            var type;

            if (i.hclass('fa-sort')) {
                // no sort
                prevsort && prevsort.el.find('i').rclass2('fa-').aclass('fa-sort');
                i.rclass('fa-sort').aclass('fa-long-arrow-up');
                type = 'asc';
            } else if (i.hclass('fa-long-arrow-up')) {
                // ascending
                i.rclass('fa-long-arrow-up').aclass('fa-long-arrow-down');
                type = 'desc';
            } else if (i.hclass('fa-long-arrow-down')) {
                // descending
                i.rclass('fa-long-arrow-down').aclass('fa-sort');
                type = '';
            }

            var index = th.index();
            var data = self.get();

            prevsort = { index: index, type: type, el: th, name: sorts[WIDTH()][index] };

            if (config.paginate) {
                var model = {};
                model.page = data.page;
                model.limit = data.limit;
                model.sort = type ? (prevsort.name + '_' + type) : undefined;
                SEEX(self.makepath(config.paginate), model);
            } else if (prevsort.name) {
                opt.items = (data.items ? data.items : data).slice(0);
                if (type)
                    opt.items.quicksort(prevsort.name, type === 'asc');
                else {
                    var tmp = self.get() || EMPTYARRAY;
                    opt.items = tmp.items ? tmp.items : tmp;
                    prevsort = null;
                }
                opt.sort = type ? (prevsort.name + '_' + type) : undefined;
                config.filter && EXEC(self.makepath(config.filter), opt, 'sort');
                self.redraw();
            }
        });

        var blacklist = { A: 1, BUTTON: 1 };
        var dblclick = 0;

        var forceselect = function(el, index, is) {

            if (!config.highlight) {
                config.exec && SEEX(self.makepath(config.exec), opt.items[index], el);
                return;
            }

            if (config.multiple) {
                if (is) {
                    if (config.unhighlight) {
                        el.rclass(cls + '-selected');
                        config.detail && self.row_detail(el);
                        opt.selected = opt.selected.remove(index);
                        config.exec && SEEX(self.makepath(config.exec), self.selected(), el);
                    }
                } else {
                    el.aclass(cls + '-selected');
                    config.exec && SEEX(self.makepath(config.exec), self.selected(), el);
                    config.detail && self.row_detail(el);
                    opt.selected.push(index);
                }
            } else {

                if (is && !config.unhighlight)
                    return;

                if (opt.selrow) {
                    opt.selrow.rclass(cls + '-selected');
                    config.detail && self.row_detail(opt.selrow);
                    opt.selrow = null;
                    opt.selindex = -1;
                }

                // Was selected
                if (is) {
                    config.exec && SEEX(self.makepath(config.exec));
                    return;
                }

                opt.selindex = index;
                opt.selrow = el;
                el.aclass(cls + '-selected');
                config.exec && SEEX(self.makepath(config.exec), opt.items[index], el);
                config.detail && self.row_detail(el);
            }
        };

        ebody.on('click', '> tr', function(e) {

            var el = $(this);
            var node = e.target;

            if (blacklist[node.tagName] || (node.tagName === 'SPAN' && node.getAttribute('class') || '').indexOf('link') !== -1)
                return;

            if (node.tagName === 'I') {
                var parent = $(node).parent();
                if (blacklist[parent[0].tagName] || (parent[0].tagName === 'SPAN' && parent.hclass('link')))
                    return;
            }

            var now = Date.now();
            var isdblclick = dblclick ? (now - dblclick) < 250 : false;
            dblclick = now;

            var index = +el.attrd('index');
            if (index > -1) {

                var is = el.hclass(cls + '-selected');

                if (isdblclick && config.dblclick && is) {
                    self.forceselectid && clearTimeout(self.forceselectid);
                    SEEX(self.makepath(config.dblclick), opt.items[index], el);
                    return;
                }

                self.forceselectid && clearTimeout(self.forceselectid);
                self.forceselectid = setTimeout(forceselect, config.dblclick ? is ? 250 : 1 : 1, el, index, is);
            }
        });

        var resize = function() {
            setTimeout2(self.ID, self.resize, 500);
        };

        $(W).on('resize', resize);
    };

    self.resize2 = function() {
        self.scrollbar && setTimeout2(self.ID + 'scrollbar', self.scrollbar.resize, 300);
    };

    self.resize = function() {

        var display = WIDTH();
        if (display !== opt.display && sizes[display] && sizes[display] !== sizes[opt.display]) {
            self.refresh();
            return;
        }

        if (config.height > 0)
            self.find(cls2 + '-container').css('height', config.height - config.margin);
        else if (config.height) {
            var el = config.height === 'window' ? $(W) : config.height === 'parent' ? self.parent() : self.closest(config.height);
            var header = self.find(cls2 + '-head');
            var footer = config.paginate ? (self.find(cls2 + '-footer').height() + 2) : 0;
            self.find(cls2 + '-container').css('height', el.height() - header.height() - footer - 2 - config.margin);
        }

        self.scrollbar && self.scrollbar.resize();
    };

    self.row_detail = function(el) {

        var index = +el.attrd('index');
        var row = opt.items[index];
        var eld = el.next();

        if (el.hclass(cls + '-selected')) {

            // Row is selected
            if (eld.hclass(cls + '-detail')) {
                // Detail exists
                eld.rclass('hidden');
            } else {

                // Detail doesn't exist
                el.after('<tr class="{0}-detail"><td colspan="{1}" data-index="{2}"></td></tr>'.format(cls, el.find('td').length, index));
                eld = el.next();

                var tmp;

                if (config.detail === true) {
                    tmp = eld.find('td');
                    tmp.html(templates.detail(row, { index: index, user: window.user, data: extradata }));
                    dcompile && COMPILE(tmp);
                } else {
                    tmp = eld.find('td');
                    EXEC(self.makepath(config.detail), row, function(row) {
                        var is = typeof(row) === 'string';
                        tmp.html(is ? row : templates.detail(row, { index: index, user: window.user, data: extradata }));
                        if ((is && row.COMPILABLE()) || dcompile)
                            COMPILE(tmp);
                    }, tmp);
                }
            }

        } else
            eld.hclass(cls + '-detail') && eld.aclass('hidden');

        self.resize2();
    };

    self.redrawrow = function(index, row) {

        if (typeof(index) === 'number')
            index = ebody.find('tr[data-index="{0}"]'.format(index));

        if (index.length) {
            var template = templates[opt.display];
            var indexer = {};
            indexer.data = extradata;
            indexer.user = W.user;
            indexer.index = +index.attrd('index');
            var is = index.hclass(cls + '-selected');
            var next = index.next();
            index.replaceWith(template(row, indexer).replace('<tr', '<tr data-index="' + indexer.index + '"'));
            next.hclass(cls + '-detail') && next.remove();
            is && ebody.find('tr[data-index="{0}"]'.format(indexer.index)).trigger('click');
        }
    };

    self.appendrow = function(row) {

        var index = opt.items.indexOf(row);
        if (index == -1)
            index = opt.items.push(row) - 1;

        var template = templates[opt.display];
        var indexer = {};
        indexer.data = extradata;
        indexer.user = W.user;
        indexer.index = index;
        ebody.append(template(row, indexer).replace('<tr', '<tr data-index="' + indexer.index + '"'));
    };

    self.removerow = function(row) {
        var index = opt.items.indexOf(row);
        if (index == -1)
            return;
        opt.selected = opt.selected.remove(index);
        opt.items.remove(row);
    };

    self.redraw = function() {
        var clsh = 'hidden';
        var count = 0;
        var indexer = { user: W.user, data: extradata };
        var builder = [];
        var template = templates[WIDTH()];
        if (template) {
            for (var i = 0; i < opt.items.length; i++) {
                var item = opt.items[i];
                count++;
                indexer.index = i;
                builder.push(template(item, indexer).replace('<tr', '<tr data-index="' + i + '"'));
            }
        }
        count && ebody.html(builder.join(''));
        eempty.tclass(clsh, count > 0);
        etable.tclass(clsh, count == 0);
        config.redraw && EXEC(self.makepath(config.redraw), self);
    };

    self.redrawpagination = function() {   
        if (!config.paginate)
            return;
        var value = self.get();        
        efooter.find('button').each(function() {

            var el = $(this);
            var dis = true;

            switch (this.name) {
                case 'page-next':
                    dis = value.page >= value.pages;
                    break;
                case 'page-prev':
                    dis = value.page === 1;
                    break;
                case 'page-last':
                    dis = !value.pages || value.page === value.pages;
                    break;
                case 'page-first':
                    dis = value.page === 1;
                    break;
            }

            el.prop('disabled', dis);
        });

        efooter.find('input')[0].value = value.page;
        efooter.find(cls2 + '-pagination-pages')[0].innerHTML = value.pages.pluralize.apply(value.pages, config.pluralizepages);
        efooter.find(cls2 + '-pagination-items')[0].innerHTML = value.count.pluralize.apply(value.count, config.pluralizeitems);
    };

    self.selected = function() {
        var rows = [];
        for (var i = 0; i < opt.selected.length; i++) {
            var row = opt.items[opt.selected[i]];
            row && rows.push(row);
        }
        return rows;
    };

    self.configure = function(key, value) {
        switch (key) {
            case 'pluralizepages':
                config.pluralizepages = value.split(',').trim();
                break;
            case 'pluralizeitems':
                config.pluralizeitems = value.split(',').trim();
                break;
            case 'datasource':
                self.datasource(value, self.bind);
                break;
            case 'paginate':
            case 'exec':
            case 'click':
            case 'filter':
            case 'redraw':
                if (value && value.SCOPE)
                    config[key] = value.SCOPE(self, value);
                break;
        }
    };

    self.bind = function(path, val) {
        extradata = val;
    };

    self.setter = function(value) {

        if (config.paginate && value == null) {
            var model = {};
            model.page = 1;
            if (prevsort)
                model.sort = prevsort && prevsort.type ? (prevsort.name + '_' + prevsort.type) : '';
            EXEC(self.makepath(config.paginate), model);
            return;
        }


        var data = value ? value.items ? value.items : value : value;
        var empty = !data || !data.length;
        var clsh = 'hidden';

        if (!self.isinit) {
            self.rclass('invisible', 10);
            self.isinit = true;
        }

        var display = WIDTH();
        var builder = [];
        var buildersize = [];
        var selected = opt.selected.slice(0);

        for (var i = 0; i < selected.length; i++) {
            var row = opt.items[selected[i]];
            selected[i] = row[config.pk];
        }

        var size = sizes[display];
        var name = names[display];
        var align = aligns[display];
        var sort = sorts[display];

        if (prevhead !== display) {
            if ((size && size.length) || (name && name.length) || (align && align.length)) {

                var arr = name || size || align;

                for (var i = 0; i < arr.length; i++) {
                    var w = !size || size[i] === '0' ? 'auto' : size[i];
                    builder.push('<th style="width:{0};text-align:{2}"{3}>{1}</th>'.format(w, (sort && sort[i] ? '<i class="fa fa-sort"></i>' : '') + (name ? name[i] : ''), align ? align[i] : 'left', sort && sort[i] ? ' class="sort"' : ''));
                    buildersize.push('<th style="width:{0}"></th>'.format(w));
                }

                ehead.parent().tclass('hidden', !name);
                ehead.html('<tr>{0}</tr>'.format(builder.join('')));
                eheadsize.html('<tr>{0}</tr>'.format(buildersize.join('')));

            } else
                ehead.html('');

            prevsort = null;
            prevhead = display;
        }

        setTimeout(self.resize, 100);

        opt.display = display;
        opt.items = data ? data.slice(0) : 0;
        opt.data = value;
        opt.selindex = -1;
        opt.selrow = null;
        opt.selected = [];
        opt.sort = prevsort;

        self.redrawpagination();
        config.filter && EXEC(self.makepath(config.filter), opt, 'refresh');
        config.exec && SEEX(self.makepath(config.exec), config.multiple ? [] : null);

        if (empty) {
            etable.aclass(clsh);
            eempty.rclass(clsh);
            return;
        }

        self.redraw();

        if (config.remember) {
            for (var i = 0; i < selected.length; i++) {
                if (selected[i]) {
                    var index = opt.items.findIndex(config.pk, selected[i]);
                    if (index !== -1)
                        ebody.find('tr[data-index="{0}"]'.format(index)).trigger('click');
                }
            }
        }
    };

});
/*==============================================================
  == j-Grid ====================================================
  ==============================================================*/
COMPONENT('grid', 'filter:true;external:false;fillcount:50;filterlabel:Filtering values ...;boolean:true|on|yes;pluralizepages:# pages,# page,# pages,# pages;pluralizeitems:# items,# item,# items,# items;pagination:false;rowheight:30', function(self, config) {

    var tbody, thead, tbodyhead, container, pagination;
    var options = { columns: {}, items: [], indexer: 0, filter: {} };
    var isFilter = false;
    var ppages, pitems, cache, eheight, wheight, scroll, filtercache, filled = false;

    self.template = Tangular.compile('<td data-index="{{ index }}"{{ if $.cls }} class="{{ $.cls }}"{{ fi }}><div class="wrap{{ if align }} {{ align }}{{ fi }}"{{ if background }} style="background-color:{{ background }}"{{ fi }}>{{ value | raw }}</div></td>');
    self.options = options;
    self.readonly();
    self.nocompile && self.nocompile();

    self.make = function() {

        var meta = self.find('script').html();
        self.aclass('ui-grid-container' + (config.autosize ? '' : ' hidden'));
        self.html('<div class="ui-grid"><table class="ui-grid-header"><thead></thead></table><div class="ui-grid-scroller"><table class="ui-grid-data"><thead></thead><tbody></tbody></table></div></div>' + (config.pagination ? '<div class="ui-grid-footer hidden"><div class="ui-grid-meta"></div><div class="ui-grid-pagination"><button class="ui-grid-button" name="first"><i class="fa fa-angle-double-left"></i></button><button class="ui-grid-button" name="prev"><i class="fa fa-angle-left"></i></button><div class="page"><input type="text" maxlength="5" class="ui-grid-input" /></div><button class="ui-grid-button" name="next"><i class="fa fa-angle-right"></i></button><button class="ui-grid-button" name="last"><i class="fa fa-angle-double-right"></i></button></div><div class="ui-grid-pages"></div></div></div>' : ''));

        var body = self.find('.ui-grid-data');
        tbody = $(body.find('tbody')[0]);
        tbodyhead = $(body.find('thead')[0]);
        thead = $(self.find('.ui-grid-header').find('thead')[0]);
        container = $(self.find('.ui-grid-scroller')[0]);

        if (config.pagination) {
            var el = self.find('.ui-grid-footer');
            pagination = {};
            pagination.main = el;
            pagination.page = el.find('input');
            pagination.first = el.find('button[name="first"]');
            pagination.last = el.find('button[name="last"]');
            pagination.prev = el.find('button[name="prev"]');
            pagination.next = el.find('button[name="next"]');
            pagination.meta = el.find('.ui-grid-meta');
            pagination.pages = el.find('.ui-grid-pages');
        }

        meta && self.meta(meta);

        self.event('click', '.ui-grid-columnsort', function() {
            var obj = {};
            obj.columns = options.columns;
            obj.column = options.columns[+$(this).attrd('index')];
            self.sort(obj);
        });

        self.event('change', '.ui-grid-filter', function() {
            var el = $(this).parent();
            if (this.value)
                options.filter[this.name] = this.value;
            else
                delete options.filter[this.name];
            el.tclass('ui-grid-selected', !!this.value);
            scroll = true;
            self.filter();
        });

        self.event('change', 'input', function() {
            var el = this;
            if (el.type === 'checkbox') {
                el && !el.value && self.checked(el.checked);
                config.checked && EXEC(config.checked, el, self);
            }
        });

        self.event('click', '.ui-grid-button', function() {
            switch (this.name) {
                case 'first':
                    scroll = true;
                    cache.page = 1;
                    self.operation('pagination');
                    break;
                case 'last':
                    scroll = true;
                    cache.page = cache.pages;
                    self.operation('pagination');
                    break;
                case 'prev':
                    scroll = true;
                    cache.page -= 1;
                    self.operation('pagination');
                    break;
                case 'next':
                    scroll = true;
                    cache.page += 1;
                    self.operation('pagination');
                    break;
            }
        });

        self.event('change', '.ui-grid-input', function() {
            var page = (+this.value) >> 0;
            if (isNaN(page) || page < 0 || page > cache.pages || page === cache.page)
                return;
            scroll = true;
            cache.page = page;
            self.operation('pagination');
        });

        tbody.on('click', 'button', function() {
            var btn = $(this);
            var tr = btn.closest('tr');
            config.button && EXEC(config.button, btn, options.items[+tr.attrd('index')], self);
        });

        var ALLOWED = { INPUT: 1, SELECT: 1 };

        tbody.on('click', '.ui-grid-row', function(e) {
            !ALLOWED[e.target.nodeName] && config.click && EXEC(config.click, options.items[+$(this).attrd('index')], self);
        });

        self.on('resize', self.resize);
        config.init && EXEC(config.init);
        wheight = WH;
    };

    self.checked = function(value) {
        if (typeof(value) === 'boolean')
            self.find('input[type="checkbox"]').prop('checked', value);
        else
            return tbody.find('input:checked');
    };

    self.meta = function(html) {

        switch (typeof(html)) {
            case 'string':
                options.columns = new Function('return ' + html.trim())();
                break;
            case 'function':
                options.columns = html(self);
                break;
            case 'object':
                options.columns = html;
                break;
        }

        options.columns = options.columns.remove(function(column) {
            return !!(column.remove && FN(column.remove)());
        });

        options.customsearch = false;

        for (var i = 0; i < options.columns.length; i++) {
            var column = options.columns[i];

            if (typeof(column.header) === 'string')
                column.header = column.header.indexOf('{{') === -1 ? new Function('return \'' + column.header + '\'') : Tangular.compile(column.header);

            if (typeof(column.template) === 'string')
                column.template = column.template.indexOf('{{') === -1 ? new Function('a', 'b', 'return \'' + column.template + '\'') : Tangular.compile(column.template);

            if (column.search) {
                options.customsearch = true;
                column.search = column.search === true ? column.template : Tangular.compile(column.search);
            }
        }

        self.rebuild(true);
    };

    self.configure = function(key, value) {
        switch (key) {
            case 'pluralizepages':
                ppages = value.split(',').trim();
                break;
            case 'pluralizeitems':
                pitems = value.split(',').trim();
                break;
        }
    };

    self.cls = function(d) {
        var a = [];
        for (var i = 1; i < arguments.length; i++) {
            var cls = arguments[i];
            cls && a.push(cls);
        }
        return a.length ? ((d ? ' ' : '') + a.join(' ')) : '';
    };

    self.rebuild = function(init) {

        var data = ['<tr class="ui-grid-empty">'];
        var header = ['<tr>'];
        var filter = ['<tr>'];

        var size = 0;
        var columns = options.columns;
        var scrollbar = SCROLLBARWIDTH();

        for (var i = 0, length = columns.length; i < length; i++) {
            var col = columns[i];

            if (typeof(col.size) !== 'string')
                size += col.size || 1;

            col.sorting = null;

            if (typeof(col.render) === 'string')
                col.render = FN(col.render);

            if (typeof(col.header) === 'string')
                col.header = FN(col.header);

            col.cls = self.cls(0, col.classtd, col.class);
        }

        for (var i = 0, length = columns.length; i < length; i++) {
            var col = columns[i];
            var width = typeof(col.size) === 'string' ? col.size : ((((col.size || 1) / size) * 100).floor(2) + '%');

            data.push('<td style="width:{0}" data-index="{1}" class="{2}"></td>'.format(width, i, self.cls(0, col.classtd, col.class)));
            header.push('<th class="ui-grid-columnname{3}{5}" style="width:{0};text-align:center" data-index="{1}" title="{6}" data-name="{4}"><div class="wrap"><i class="fa hidden ui-grid-fa"></i>{2}</div></th>'.format(width, i, col.header ? col.header(col) : (col.text || col.name), self.cls(1, col.classth, col.class), col.name, col.sort === false ? '' : ' ui-grid-columnsort', col.title || col.text || col.name));
            if (col.filter === false)
                filter.push('<th class="ui-grid-columnfilterempty ui-grid-columnfilter{1}" style="width:{0}">&nbsp;</th>'.format(width, self.cls(1, col.classfilter, col.class)));
            else
                filter.push('<th class="ui-grid-columnfilter{4}" style="width:{0}"><input type="text" placeholder="{3}" name="{2}" autocomplete="off" class="ui-grid-filter" /></th>'.format(width, i, col.name, col.filter || config.filterlabel, self.cls(1, col.classfilter, col.class)));
        }

        if (scrollbar) {
            header.push('<th class="ui-grid-columnname ui-grid-scrollbar" style="width:{0}px"></th>'.format(scrollbar));
            filter.push('<th class="ui-grid-columnfilterempty ui-grid-scrollbar ui-grid-columnfilter{1}" style="width:{0}px">&nbsp;</th>'.format(scrollbar, self.cls(1, col.classtd, col.class)));
        }

        tbodyhead.html(data.join('') + '</tr>');
        thead.html(header.join('') + '</tr>' + (config.filter ? (filter.join('') + '</tr>') : ''));
        !init && self.refresh();
        isFilter = false;
        options.filter = {};
    };

    self.fill = function() {

        if (config.autosize === false || filled)
            return;

        filled = true;
        tbody.find('.emptyfill').remove();
        var builder = ['<tr class="emptyfill">'];

        var cols = options.columns;
        for (var i = 0, length = cols.length; i < length; i++) {
            var col = cols[i];
            if (!col.hidden) {
                var cls = self.cls(0, col.classtd, col.class);
                builder.push('<td{0}>'.format(cls ? (' class="' + cls + '"') : '') + (i ? '' : '<div class="wrap">&nbsp;</div>') + '</td>');
            }
        }

        builder.push('</tr>');
        builder = builder.join('');
        var buffer = [];
        for (var i = 0; i < config.fillcount; i++)
            buffer.push(builder);
        tbody.append(buffer.join(''));
    };

    self.resize = function(delay) {

        if (config.autosize === false) {
            self.hclass('hidden') && self.rclass('hidden');
            return;
        }

        setTimeout2(self.id + '.resize', function() {

            var parent = self.parent().height();
            if (parent < wheight / 3)
                return;

            var value = options.items;
            var height = parent - (config.padding || 0) - (config.pagination ? 105 : 74);

            if (height === eheight)
                return;

            container.height(height);
            eheight = height;

            var cls = 'ui-grid-noscroll';
            var count = (height / config.rowheight) >> 0;
            if (count > value.length) {
                self.fill(config.fillcount);
                self.aclass(cls);
            } else
                self.rclass(cls);

            pagination && pagination.main.rclass('hidden');
            eheight && self.rclass('hidden');
        }, typeof(delay) === 'number' ? delay : 50);
    };

    self.limit = function() {
        return Math.ceil(container.height() / config.rowheight);
    };

    self.filter = function() {
        isFilter = Object.keys(options.filter).length > 0;
        !config.external && self.refresh();
        self.operation('filter');
    };

    self.operation = function(type) {
        if (type === 'filter')
            cache.page = 1;
        config.exec && EXEC(config.exec, type, isFilter ? options.filter : null, options.lastsort ? options.lastsort : null, cache.page, self);
    };

    self.sort = function(data) {

        options.lastsortelement && options.lastsortelement.rclass('fa-caret-down fa-caret-up').aclass('hidden');

        if (data.column.sorting === 'desc') {
            options.lastsortelement.find('.ui-grid-fa').rclass('fa-caret-down fa-caret-up').aclass('hidden');
            options.lastsortelement = null;
            options.lastsort = null;
            data.column.sorting = null;

            if (config.external)
                self.operation('sort');
            else
                self.refresh();

        } else if (data.column) {
            data.column.sorting = data.column.sorting === 'asc' ? 'desc' : 'asc';
            options.lastsortelement = thead.find('th[data-name="{0}"]'.format(data.column.name)).find('.ui-grid-fa').rclass('hidden').tclass('fa-caret-down', data.column.sorting === 'asc').tclass('fa-caret-up', data.column.sorting === 'desc');
            options.lastsort = data.column;

            var name = data.column.name;
            var sort = data.column.sorting;

            !config.external && options.lastsort && options.items.quicksort(name, sort !== 'asc');
            self.operation('sort');
            self.redraw();
        }
    };

    self.can = function(row) {

        var keys = Object.keys(options.filter);

        for (var i = 0; i < keys.length; i++) {

            var column = keys[i];
            var filter = options.filter[column];
            var val2 = filtercache[column];
            var val = row['$' + column] || row[column];

            var type = typeof(val);

            if (val instanceof Array) {
                val = val.join(' ');
                type = 'string';
            }

            if (type === 'number') {

                if (val2 == null)
                    val2 = filtercache[column] = self.parseNumber(filter);

                if (val2.length === 1 && val !== val2[0])
                    return false;

                if (val < val2[0] || val > val2[1])
                    return false;

            } else if (type === 'string') {

                if (val2 == null) {
                    val2 = filtercache[column] = filter.split(/\/\|\\|,/).trim();
                    for (var j = 0; j < val2.length; j++)
                        val2[j] = val2[j].toSearch();
                }

                var is = false;
                var s = val.toSearch();

                for (var j = 0; j < val2.length; j++) {
                    if (s.indexOf(val2[j]) !== -1) {
                        is = true;
                        break;
                    }
                }

                if (!is)
                    return false;

            } else if (type === 'boolean') {
                if (val2 == null)
                    val2 = filtercache[column] = config.boolean.indexOf(filter.replace(/\s/g, '')) !== -1;
                if (val2 !== val)
                    return false;
            } else if (val instanceof Date) {

                val.setHours(0);
                val.setMinutes(0);

                if (val2 == null) {

                    val2 = filter.trim().replace(/\s-\s/, '/').split(/\/|\||\\|,/).trim();
                    var arr = filtercache[column] = [];

                    for (var j = 0; j < val2.length; j++) {
                        var dt = val2[j].trim();
                        var a = self.parseDate(dt);
                        if (a instanceof Array) {
                            if (val2.length === 2) {
                                arr.push(j ? a[1] : a[0]);
                            } else {
                                arr.push(a[0]);
                                if (j === val2.length - 1) {
                                    arr.push(a[1]);
                                    break;
                                }
                            }
                        } else
                            arr.push(a);
                    }

                    if (val2.length === 2 && arr.length === 2) {
                        arr[1].setHours(23);
                        arr[1].setMinutes(59);
                        arr[1].setSeconds(59);
                    }

                    val2 = arr;
                }

                if (val2.length === 1 && val.format('yyyyMMdd') !== val2[0].format('yyyyMMdd'))
                    return false;

                if (val < val2[0] || val > val2[1])
                    return false;
            } else
                return false;
        }

        return true;
    };

    self.parseDate = function(val) {
        var index = val.indexOf('.');
        if (index === -1) {
            if ((/[a-z]+/).test(val)) {
                var dt = NOW.add(val);
                return dt > NOW ? [NOW, dt] : [dt, NOW];
            }
            if (val.length === 4)
                return [new Date(+val, 0, 1), new Date(+val + 1, 0  , 1)];
        } else if (val.indexOf('.', index + 1) === -1) {
            var a = val.split('.');
            return new Date(NOW.getFullYear(), +a[1] - 1, +a[0]);
        }
        index = val.indexOf('-');
        if (index !== -1 && val.indexOf('-', index + 1) === -1) {
            var a = val.split('-');
            return new Date(NOW.getFullYear(), +a[0] - 1, +a[1]);
        }
        return val.parseDate();
    };

    self.parseNumber = function(val) {
        var arr = [];
        var num = val.replace(/\s-\s/, '/').replace(/\s/g, '').replace(/,/g, '.').split(/\/|\|\s-\s|\\/).trim();

        for (var i = 0, length = num.length; i < length; i++) {
            var n = num[i];
            arr.push(+n);
        }

        return arr;
    };

    self.reset = function() {
        options.filter = {};
        isFilter = false;
        thead.find('input').val('');
        thead.find('.ui-grid-selected').rclass('ui-grid-selected');
        options.lastsortelement && options.lastsortelement.rclass('fa-caret-down fa-caret-up');
        options.lastsortelement = null;
        if (options.lastsort)
            options.lastsort.sorting = null;
        options.lastsort = null;
    };

    self.redraw = function() {

        var items = options.items;
        var columns = options.columns;
        var builder = [];
        var m = {};

        for (var i = 0, length = items.length; i < length; i++) {
            builder.push('<tr class="ui-grid-row" data-index="' + i + '">');
            for (var j = 0, jl = columns.length; j < jl; j++) {
                var column = columns[j];
                var val = items[i][column.name];
                m.value = column.template ? column.template(items[i], column) : column.render ? column.render(val, column, items[i]) : val == null ? '' : Thelpers.encode((column.format ? val.format(column.format) : val));
                m.index = j;
                m.align = column.align;
                m.background = column.background;
                builder.push(self.template(m, column));
            }
            builder.push('</tr>');
        }

        tbody.find('.ui-grid-row').remove();
        tbody.prepend(builder.join(''));
        container.rclass('noscroll');
        scroll && container.prop('scrollTop', 0);
        scroll = false;
        eheight = 0;
        self.resize(0);
    };

    self.setter = function(value) {

        // value.items
        // value.limit
        // value.page
        // value.pages
        // value.count

        if (!value) {
            tbody.find('.ui-grid-row').remove();
            self.resize();
            return;
        }

        cache = value;

        if (config.pagination) {
            pagination.prev.prop('disabled', value.page === 1);
            pagination.first.prop('disabled', value.page === 1);
            pagination.next.prop('disabled', value.page >= value.pages);
            pagination.last.prop('disabled', value.page === value.pages);
            pagination.page.val(value.page);
            pagination.meta.html(value.count.pluralize.apply(value.count, pitems));
            pagination.pages.html(value.pages.pluralize.apply(value.pages, ppages));
        }

        if (options.customsearch) {
            for (var i = 0, length = value.items.length; i < length; i++) {
                var item = value.items[i];
                for (var j = 0; j < options.columns.length; j++) {
                    var col = options.columns[j];
                    if (col.search)
                        item['$' + col.name] = col.search(item);
                }
            }
        }

        if (config.external) {
            options.items = value.items;
        } else {
            options.items = [];
            filtercache = {};
            for (var i = 0, length = value.items.length; i < length; i++) {
                var item = value.items[i];
                if (isFilter && !self.can(item))
                    continue;
                options.items.push(item);
            }
            options.lastsort && options.items.quicksort(options.lastsort.name, options.lastsort.sorting === 'asc');
        }

        self.redraw();
        config.checked && EXEC(config.checked, null, self);
    };
});
/*==============================================================
  == j-DataGrid ================================================
  ==============================================================*/
COMPONENT('datagrid', 'checkbox:true;colwidth:150;rowheight:28;clusterize:true;limit:80;filterlabel:Filter;height:auto;margin:0;resize:true;reorder:true;sorting:true;boolean:true,on,yes;pluralizepages:# pages,# page,# pages,# pages;pluralizeitems:# items,# item,# items,# items;remember:true;highlight:false;unhighlight:true;autoselect:false;buttonapply:Apply;buttonreset:Reset;allowtitles:false;fullwidth_xs:true;clickid:id;dirplaceholder:Search', function(self, config) {

	var opt = { filter: {}, filtercache: {}, filtercl: {}, filtervalues: {}, scroll: false, selected: {}, operation: '' };
	var header, vbody, footer, container, ecolumns, isecolumns = false, ready = false;
	var sheader, sbody;
	var Theadercol = Tangular.compile('<div class="dg-hcol dg-col-{{ index }}{{ if sorting }} dg-sorting{{ fi }}" data-index="{{ index }}">{{ if sorting }}<i class="dg-sort fa fa-sort"></i>{{ fi }}<div class="dg-label{{ alignheader }}"{{ if labeltitle }} title="{{ labeltitle }}"{{ fi }}{{ if reorder }} draggable="true"{{ fi }}>{{ label | raw }}</div>{{ if filter }}<div class="dg-filter{{ alignfilter }}{{ if filterval != null && filterval !== \'\' }} dg-filter-selected{{ fi }}"><i class="fa dg-filter-cancel fa-times"></i>{{ if options }}<label data-name="{{ name }}">{{ if filterval }}{{ filterval }}{{ else }}{{ filter }}{{ fi }}</label>{{ else }}<input autocomplete="new-password" type="text" placeholder="{{ filter }}" class="dg-filter-input" name="{{ name }}{{ ts }}" data-name="{{ name }}" value="{{ filterval }}" />{{ fi }}</div>{{ else }}<div class="dg-filter-empty">&nbsp;</div>{{ fi }}</div>');
	var isIE = (/msie|trident/i).test(navigator.userAgent);
	var isredraw = false;
	var forcescroll = '';
	var schemas = {};

	self.meta = opt;

	function Cluster(el) {

		var self = this;
		var dom = el[0];
		var scrollel = el;

		self.row = config.rowheight;
		self.rows = [];
		self.limit = config.limit;
		self.pos = -1;
		self.enabled = !!config.clusterize;
		self.plus = 0;
		self.scrolltop = 0;
		self.prev = 0;

		var seh = '<div style="height:0"></div>';
		var set = $(seh);
		var seb = $(seh);

		var div = document.createElement('DIV');
		dom.appendChild(set[0]);
		dom.appendChild(div);
		dom.appendChild(seb[0]);
		self.el = $(div);

		self.render = function() {

			var t = self.pos * self.frame;
			var b = (self.rows.length * self.row) - (self.frame * 2) - t;
			var pos = self.pos * self.limit;
			var posto = pos + (self.limit * 2);

			set.css('height', t);
			seb.css('height', b < 2 ? isMOBILE ? (config.exec ? (self.row + 1) : (self.row * 2.25)) >> 0 : 3 : b);

			var tmp = self.scrollbar[0].scrollTop;
			var node = self.el[0];
			// node.innerHTML = '';

			var child = node.firstChild;

			while (child) {
				node.removeChild(child);
				child = node.firstChild;
			}

			for (var i = pos; i < posto; i++) {
				if (typeof(self.rows[i]) === 'string')
					self.rows[i] = $(self.rows[i])[0];

				if (self.rows[i])
					node.appendChild(self.rows[i]);
				else
					break;
			}

			if (self.prev < t)
				self.scrollbar[0].scrollTop = t;
			else
				self.scrollbar[0].scrollTop = tmp;

			self.prev = t;

			if (self.grid.selected) {
				var index = opt.rows.indexOf(self.grid.selected);
				if (index !== -1 && (index >= pos || index <= (pos + self.limit)))
					self.el.find('.dg-row[data-index="{0}"]'.format(index)).aclass('dg-selected');
			}
		};

		self.scrolling = function() {

			var y = self.scrollbar[0].scrollTop + 1;
			self.scrolltop = y;

			if (y < 0)
				return;

			var frame = Math.ceil(y / self.frame) - 1;
			if (frame === -1)
				return;

			if (self.pos !== frame) {

				// The content could be modified
				var plus = (self.el[0].offsetHeight / 2) - self.frame;
				if (plus > 0) {
					frame = Math.ceil(y / (self.frame + plus)) - 1;
					if (self.pos === frame)
						return;
				}

				if (self.max && frame >= self.max)
					frame = self.max;

				self.pos = frame;

				if (self.enabled)
					self.render();
				else {

					var node = self.el[0];
					var child = node.firstChild;

					while (child) {
						node.removeChild(child);
						child = node.firstChild;
					}

					for (var i = 0; i < self.rows.length; i++) {
						if (typeof(self.rows[i]) === 'string')
							self.rows[i] = $(self.rows[i])[0];
						self.el[0].appendChild(self.rows[i]);
					}
				}

				self.scroll && self.scroll();
				config.change && SEEX(self.makepath(config.change), null, null, self.grid);
			}
		};

		self.update = function(rows, noscroll) {

			if (noscroll != true)
				self.el[0].scrollTop = 0;

			self.limit = config.limit;
			self.pos = -1;
			self.rows = rows;
			self.max = Math.ceil(rows.length / self.limit) - 1;
			self.frame = self.limit * self.row;

			if (!self.enabled) {
				self.frame = 1000000;
			} else if (self.limit * 2 > rows.length) {
				self.limit = rows.length;
				self.frame = self.limit * self.row;
				self.max = 1;
			}

			self.scrolling();
		};

		self.destroy = function() {
			self.el.off('scroll');
			self.rows = null;
		};

		self.scrollbar = scrollel.closest('.ui-scrollbar-area');
		self.scrollbar.on('scroll', self.scrolling);
	}

	self.destroy = function() {
		opt.cluster && opt.cluster.destroy();
	};

	// opt.cols    --> columns
	// opt.rows    --> raw rendered data
	// opt.render  --> for cluster

	self.init = function() {

		$(window).on('resize', function() {
			setTimeout2('datagridresize', function() {
				SETTER('datagrid', 'resize');
			}, 500);
		});

		Thelpers.ui_datagrid_checkbox = function(val) {
			return '<div class="dg-checkbox' + (val ? ' dg-checked' : '') + '" data-custom="1"><i class="fa fa-check"></i></div>';
		};
	};

	self.readonly();
	self.bindvisible();
	self.nocompile();

	var reconfig = function() {
		self.tclass('dg-clickable', !!(config.click || config.dblclick));
	};

	self.configure = function(key, value, init) {
		switch (key) {
			case 'noborder':
				self.tclass('dg-noborder', !!value);
				break;
			case 'checkbox':
			case 'numbering':
				!init && self.cols(NOOP);
				break;
			case 'pluralizepages':
				config.pluralizepages = value.split(',').trim();
				break;
			case 'pluralizeitems':
				config.pluralizeitems = value.split(',').trim();
				break;
			case 'checked':
			case 'button':
			case 'exec':
				if (value && value.SCOPE)
					config[key] = value.SCOPE(self, value);
				break;
			case 'dblclick':
				if (value && value.SCOPE)
					config.dblclick = value.SCOPE(self, value);
				break;
			case 'click':
				if (value && value.SCOPE)
					config.click = value.SCOPE(self, value);
				break;
			case 'columns':
				self.datasource(value, function(path, value, type) {
					if (value) {
						opt.sort = null;
						opt.filter = {};
						opt.scroll = '';
						opt.selected = {};
						self.rebind(value);
						type && self.setter(null);
					}
				});
				break;
		}

		setTimeout2(self.ID + 'reconfigure', reconfig);
	};

	self.refresh = function() {
		self.refreshfilter();
	};

	self.applycolumns = function(use) {
		isecolumns = false;
		ecolumns.aclass('hidden');
		if (use) {
			var hidden = {};
			ecolumns.find('input').each(function() {
				hidden[this.value] = !this.checked;
			});
			self.cols(function(cols) {
				for (var i = 0; i < cols.length; i++) {
					var col = cols[i];
					col.hidden = hidden[col.id] === true;
				}
			});
		}
	};

	self.fn_in_changed = function(arr) {
		config.changed && SEEX(self.makepath(config.changed), arr || self.changed(), self);
	};

	self.fn_in_checked = function(arr) {
		config.checked && SEEX(self.makepath(config.checked), arr || self.checked(), self);
	};

	self.fn_refresh = function() {
		setTimeout2(self.ID + 'filter', function() {
			if (config.exec)
				self.operation(opt.operation);
			else
				self.refreshfilter(true);
		}, 50);
	};

	self.make = function() {

		self.IDCSS = GUID(5);
		self.aclass('dg dg-noscroll dg-' + self.IDCSS);

		self.find('script').each(function() {
			var el = $(this);
			var id = el.attrd('id');

			if (id)
				schemas[id] = el.html();

			if (!schemas.default)
				schemas.default = el.html();
		});

		var pagination = '';

		if (config.exec)
			pagination = '<div class="dg-footer hidden"><div class="dg-pagination-items hidden-xs"></div><div class="dg-pagination"><button name="page-first" disabled><i class="fa fa-angle-double-left"></i></button><button name="page-prev" disabled><i class="fa fa-angle-left"></i></button><div><input type="text" name="page" maxlength="5" class="dg-pagination-input" /></div><button name="page-next" disabled><i class="fa fa-angle-right"></i></button><button name="page-last" disabled><i class="fa fa-angle-double-right"></i></button></div><div class="dg-pagination-pages"></div></div>';

		self.dom.innerHTML = '<div class="dg-btn-columns"><i class="fa fa-caret-left"></i><span class="fa fa-columns"></span></div><div class="dg-columns hidden"><div><div class="dg-columns-body"></div></div><button class="dg-columns-button" name="columns-apply"><i class="fa fa-columns"></i>{1}</button><span class="dt-columns-reset">{2}</span></div><div class="dg-container"><span class="dg-resize-line hidden"></span><div class="dg-header-scrollbar"><div class="dg-header"></div><div class="dg-body-scrollbar"><div class="dg-body"></div></div></div></div>{0}'.format(pagination, config.buttonapply, config.buttonreset);

		header = self.find('.dg-header');
		vbody = self.find('.dg-body');
		footer = self.find('.dg-footer');
		container = self.find('.dg-container');
		ecolumns = self.find('.dg-columns');

		sheader = self.find('.dg-header-scrollbar');
		sbody = self.find('.dg-body-scrollbar');

		self.scrollbarY = SCROLLBAR(sbody, { visibleY: true, orientation: 'y', controls: container, marginY: 58 });
		self.scrollbarX = SCROLLBAR(sheader, { visibleX: true, orientation: 'x', controls: container });

		// self.scrollbar.sync(sheader, 'x');

		if (schemas.default) {
			self.rebind(schemas.default);
			schemas.$current = 'default';
		}

		var events = {};

		events.mouseup = function(e) {
			if (r.is) {
				r.is = false;
				r.line.aclass('hidden');
				r.el.css('height', r.h);
				var x = r.el.css('left').parseInt();
				var index = +r.el.attrd('index');
				var width = opt.cols[index].width + (x - r.x);
				self.resizecolumn(index, width);
				e.preventDefault();
				e.stopPropagation();
			}
			events.unbind();
		};

		events.unbind = function() {
			$(W).off('mouseup', events.mouseup).off('mousemove', events.mousemove);
		};

		events.bind = function() {
			$(W).on('mouseup', events.mouseup).on('mousemove', events.mousemove);
		};

		var hidedir = function() {
			ishidedir = true;
			SETTER('!directory', 'hide');
			setTimeout(function() {
				ishidedir = false;
			}, 800);
		};

		var ishidedir = false;
		var r = { is: false };

		self.event('click', '.dg-btn-columns', function(e) {
			e.preventDefault();
			e.stopPropagation();

			var cls = 'hidden';
			if (isecolumns) {
				self.applycolumns();
			} else {
				var builder = [];

				for (var i = 0; i < opt.cols.length; i++) {
					var col = opt.cols[i];
					(col.listcolumn && !col.$hidden) && builder.push('<div><label><input type="checkbox" value="{0}"{1} /><span>{2}</span></label></div>'.format(col.id, col.hidden ? '' : ' checked', col.text));
				}

				ecolumns.find('.dg-columns-body')[0].innerHTML = builder.join('');
				ecolumns.rclass(cls);
				isecolumns = true;
			}
		});

		header.on('click', 'label', function() {

			var el = $(this);
			var index = +el.closest('.dg-hcol').attrd('index');
			var col = opt.cols[index];
			var opts = col.options instanceof Array ? col.options : GET(col.options);
			var dir = {};

			dir.element = el;
			dir.items = opts;
			dir.key = col.otext;
			dir.offsetX = -6;
			dir.offsetY = -2;
			dir.placeholder = config.dirplaceholder;

			dir.callback = function(item) {
				self.applyfilterdirectory(el, col, item);
			};

			SETTER('directory', 'show', dir);
		});

		self.event('dblclick', '.dg-col', function(e) {
			e.preventDefault();
			e.stopPropagation();
			self.editcolumn($(this));
		});

		var dblclick = { ticks: 0, id: null, row: null };
		r.line = container.find('.dg-resize-line');

		self.event('click', '.dg-row', function(e) {

			var now = Date.now();
			var el = $(this);
			var type = e.target.tagName;
			var target = $(e.target);

			if ((type === 'DIV' || type === 'SPAN') && !target.closest('.dg-checkbox').length) {

				var cls = 'dg-selected';
				var elrow = el.closest('.dg-row');
				var index = +elrow.attrd('index');
				var row = opt.rows[index];
				if (row == null)
					return;

				if (config.dblclick && dblclick.ticks && dblclick.ticks > now && dblclick.row === row) {
					config.dblclick && SEEX(self.makepath(config.dblclick), row, self, elrow, target);
					if (config.highlight && self.selected !== row) {
						opt.cluster.el.find('.' + cls).rclass(cls);
						self.selected = row;
						elrow.aclass(cls);
					}
					e.preventDefault();
					return;
				}

				dblclick.row = row;
				dblclick.ticks = now + 300;

				var rowarg = row;

				if (config.highlight) {
					opt.cluster.el.find('.' + cls).rclass(cls);
					if (!config.unhighlight || self.selected !== row) {
						self.selected = row;
						elrow.aclass(cls);
					} else
						rowarg = self.selected = null;
				}

				config.click && SEEX(self.makepath(config.click), rowarg, self, elrow, target);
			}
		});

		self.released = function(is) {
			!is && setTimeout(self.resize, 500);
		};

		self.event('click', '.dg-filter-cancel,.dt-columns-reset', function() {
			var el = $(this);
			if (el.hclass('dt-columns-reset'))
				self.resetcolumns();
			else {
				var tmp = el.parent();
				var input = tmp.find('input');
				if (input.length) {
					input.val('');
					input.trigger('change');
					return;
				}

				var label = tmp.find('label');
				if (label.length) {
					tmp.rclass('dg-filter-selected');
					var index = +el.closest('.dg-hcol').attrd('index');
					var col = opt.cols[index];
					var k = label.attrd('name');
					label.html(col.filter);
					forcescroll = opt.scroll = 'y';
					opt.operation = 'filter';
					delete opt.filter[k];
					delete opt.filtervalues[col.id];
					delete opt.filtercl[k];
					self.fn_refresh();
				}
			}
		});

		self.event('click', '.dg-label,.dg-sort', function() {

			var el = $(this).closest('.dg-hcol');

			if (!el.find('.dg-sort').length)
				return;

			var index = +el.attrd('index');

			for (var i = 0; i < opt.cols.length; i++) {
				if (i !== index)
					opt.cols[i].sort = 0;
			}

			var col = opt.cols[index];
			switch (col.sort) {
				case 0:
					col.sort = 1;
					break;
				case 1:
					col.sort = 2;
					break;
				case 2:
					col.sort = 0;
					break;
			}

			opt.sort = col;
			opt.operation = 'sort';
			forcescroll = '-';

			if (config.exec)
				self.operation(opt.operation);
			else
				self.refreshfilter(true);
		});

		isIE && self.event('keydown', 'input', function(e) {
			if (e.keyCode === 13)
				$(this).blur();
			else if (e.keyCode === 27)
				$(this).val('');
		});

		self.event('mousedown', function(e) {
			var el = $(e.target);

			if (!el.hclass('dg-resize'))
				return;

			events.bind();

			var offset = self.element.offset().left;
			r.el = el;
			r.offset = offset; //offset;

			var prev = el.prev();
			r.min = (prev.length ? prev.css('left').parseInt() : (config.checkbox ? 70 : 30)) + 50;
			r.h = el.css('height');
			r.x = el.css('left').parseInt();
			r.line.css('height', opt.height);
			r.is = true;
			r.isline = false;
			e.preventDefault();
			e.stopPropagation();
		});

		header.on('mousemove', function(e) {
			if (r.is) {
				var x = (e.pageX - r.offset - 10);
				var x2 = self.scrollbarX.scrollLeft() + x;
				if (x2 < r.min)
					x2 = r.min;

				r.el.css('left', x2);
				r.line.css('left', x + 9);

				if (!r.isline) {
					r.isline = true;
					r.line.rclass('hidden');
				}

				e.preventDefault();
				e.stopPropagation();
			}
		});

		self.applyfilterdirectory = function(label, col, item) {

			var val = item[col.ovalue];
			var is = val != null && val !== '';
			var name = label.attrd('name');

			opt.filtervalues[col.id] = val;

			if (is) {
				if (opt.filter[name] == val)
					return;
				opt.filter[name] = val;
			} else
				delete opt.filter[name];

			delete opt.filtercache[name];
			opt.filtercl[name] = val;

			forcescroll = opt.scroll = 'y';
			opt.operation = 'filter';
			label.parent().tclass('dg-filter-selected', is);
			label.text(item[col.otext] || '');
			self.fn_refresh();
		};

		var d = { is: false };

		self.event('dragstart', function(e) {
			!isIE && e.originalEvent.dataTransfer.setData('text/plain', GUID());
		});

		self.event('dragenter dragover dragexit drop dragleave', function (e) {

			e.stopPropagation();
			e.preventDefault();

			switch (e.type) {
				case 'drop':

					if (d.is) {
						var col = opt.cols[+$(e.target).closest('.dg-hcol').attrd('index')];
						col && self.reordercolumn(d.index, col.index);
					}

					d.is = false;
					break;

				case 'dragenter':
					if (!d.is) {
						d.index = +$(e.target).closest('.dg-hcol').attrd('index');
						d.is = true;
					}
					return;
				case 'dragover':
					return;
				default:
					return;
			}
		});

		self.event('change', '.dg-pagination-input', function() {

			var value = self.get();
			var val = +this.value;

			if (isNaN(val))
				return;

			if (val >= value.pages)
				val = value.pages;
			else if (val < 1)
				val = 1;

			value.page = val;
			forcescroll = opt.scroll = 'y';
			self.operation('page');
		});

		self.event('change', '.dg-filter-input', function() {

			var input = this;
			var $el = $(this);
			var el = $el.parent();
			var val = $el.val();
			var name = input.getAttribute('data-name');

			var col = opt.cols[+el.closest('.dg-hcol').attrd('index')];
			delete opt.filtercache[name];
			delete opt.filtercl[name];

			if (col.options) {
				if (val)
					val = (col.options instanceof Array ? col.options : GET(col.options))[+val][col.ovalue];
				else
					val = null;
			}

			var is = val != null && val !== '';

			if (col)
				opt.filtervalues[col.id] = val;

			if (is) {
				if (opt.filter[name] == val)
					return;
				opt.filter[name] = val;
			} else
				delete opt.filter[name];

			forcescroll = opt.scroll = 'y';
			opt.operation = 'filter';
			el.tclass('dg-filter-selected', is);
			self.fn_refresh();
		});

		self.select = function(row) {

			var index;

			if (typeof(row) === 'number') {
				index = row;
				row = opt.rows[index];
			} else if (row)
				index = opt.rows.indexOf(row);

			var cls = 'dg-selected';

			if (!row || index === -1) {
				self.selected = null;
				opt.cluster && opt.cluster.el.find('.' + cls).rclass(cls);
				config.highlight && config.click && SEEX(self.makepath(config.click), null, self);
				return;
			}

			self.selected = row;

			var elrow = opt.cluster.el.find('.dg-row[data-index="{0}"]'.format(index));
			if (elrow && config.highlight) {
				opt.cluster.el.find('.' + cls).rclass(cls);
				elrow.aclass(cls);
			}

			config.click && SEEX(self.makepath(config.click), row, self, elrow, null);
		};

		self.event('click', '.dg-checkbox', function() {

			var t = $(this);
			var custom = t.attrd('custom');

			if (custom === '1')
				return;

			t.tclass('dg-checked');

			if (custom === '2')
				return;

			var val = t.attrd('value');
			var checked = t.hclass('dg-checked');

			if (val === '-1') {
				if (checked) {
					opt.checked = {};
					for (var i = 0; i < opt.rows.length; i++)
						opt.checked[opt.rows[i].ROW] = 1;
				} else
					opt.checked = {};
				self.scrolling();
			} else if (checked)
				opt.checked[val] = 1;
			else
				delete opt.checked[val];

			self.fn_in_checked();
		});

		self.event('click', 'button', function(e) {
			switch (this.name) {
				case 'columns-apply':
					self.applycolumns(true);
					break;
				case 'page-first':
					forcescroll = opt.scroll = 'y';
					self.get().page = 1;
					self.operation('page');
					break;
				case 'page-last':
					forcescroll = opt.scroll = 'y';
					var tmp = self.get();
					tmp.page = tmp.pages;
					self.operation('page');
					break;
				case 'page-prev':
					forcescroll = opt.scroll = 'y';
					self.get().page -= 1;
					self.operation('page');
					break;
				case 'page-next':
					forcescroll = opt.scroll = 'y';
					self.get().page += 1;
					self.operation('page');
					break;
				default:
					var el = $(this);
					var row = opt.rows[+el.closest('.dg-row').attrd('index')];
					config.button && SEEX(self.makepath(config.button), this.name, row, el, e);
					break;
			}
		});

		self.scrollbarX.area.on('scroll', function() {
			!ishidedir && hidedir();
			isecolumns && self.applycolumns();
		});

		// config.exec && self.operation('init');
	};

	self.operation = function(type) {

		var value = self.get();

		if (value == null)
			value = {};

		if (type === 'filter' || type === 'init')
			value.page = 1;

		var keys = Object.keys(opt.filter);
		SEEX(self.makepath(config.exec), type, keys.length ? opt.filter : null, opt.sort && opt.sort.sort ? [(opt.sort.name + '_' + (opt.sort.sort === 1 ? 'asc' : 'desc'))] : null, value.page, self);

		switch (type) {
			case 'sort':
				self.redrawsorting();
				break;
		}
	};

	function align(type) {
		return type === 1 ? 'center' : type === 2 ? 'right' : type;
	}

	self.clear = function() {
		for (var i = 0; i < opt.rows.length; i++)
			opt.rows[i].CHANGES = undefined;
		self.renderrows(opt.rows, true);
		opt.cluster && opt.cluster.update(opt.render);
		self.fn_in_changed();
	};

	self.editcolumn = function(rindex, cindex) {

		var col;
		var row;

		if (cindex == null) {
			if (rindex instanceof jQuery) {
				cindex = rindex.attr('class').match(/\d+/);
				if (cindex)
					cindex = +cindex[0];
				else
					return;
				col = rindex;
			}
		} else
			row = opt.cluster.el.find('.dg-row-' + (rindex + 1));

		if (!col)
			col = row.find('.dg-col-' + cindex);

		var index = cindex;
		if (index == null)
			return;

		if (!row)
			row = col.closest('.dg-row');

		var data = {};
		data.col = opt.cols[index];
		if (!data.col.editable)
			return;

		data.rowindex = +row.attrd('index');
		data.row = opt.rows[data.rowindex];
		data.colindex = index;
		data.value = data.row[data.col.name];
		data.elrow = row;
		data.elcol = col;

		var clone = col.clone();
		var cb = function(data) {

			if (data == null) {
				col.replaceWith(clone);
				return;
			}

			data.row[data.col.name] = data.value;

			if (opt.rows[data.rowindex] != data.row)
				opt.rows[data.rowindex] = data.row;

			if (!data.row.CHANGES)
				data.row.CHANGES = {};

			data.row.CHANGES[data.col.name] = true;
			opt.render[data.rowindex] = $(self.renderrow(data.rowindex, data.row))[0];
			data.elrow.replaceWith(opt.render[data.rowindex]);
			self.fn_in_changed();

		};

		if (config.change)
			EXEC(self.makepath(config.change), data, cb, self);
		else
			self.datagrid_edit(data, cb);
	};

	self.applyfilter = function(obj, add) {


		if (!ready) {
			setTimeout(self.applyfilter, 100, obj, add);
			return;
		}

		if (!add)
			opt.filter = {};

		var keys = Object.keys(obj);

		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			var col = opt.cols.findItem('name', key);
			if (col.options) {
				var items = col.options instanceof Array ? col.options : GET(col.options);
				if (items instanceof Array) {
					var item = items.findItem(col.ovalue, obj[key]);
					if (item) {
						var el = header.find('.dg-hcol[data-index="{0}"] label'.format(col.index));
						if (el.length)
							self.applyfilterdirectory(el, col, item);
					}
				}
			}
		}

		header.find('input').each(function() {
			var t = this;
			var el = $(t);
			var val = obj[el.attrd('name')];
			if (val !== undefined)
				el.val(val == null ? '' : val);
		}).trigger('change');

	};

	self.rebind = function(code) {

		if (code.length < 30 && code.indexOf(' ') === -1) {
			schemas.$current = code;
			schemas[code] && self.rebind(schemas[code]);
			return;
		}

		opt.declaration = code;

		var type = typeof(code);
		if (type === 'string') {
			code = code.trim();
			self.gridid = 'dg' + HASH(code);
		} else
			self.gridid = 'dg' + HASH(JSON.stringify(code));

		var cache = config.remember ? W.PREF ? W.PREF.get(self.gridid) : CACHE(self.gridid) : null;
		var cols = type === 'string' ? new Function('return ' + code)() : CLONE(code);
		var tmp;

		opt.rowclasstemplate = null;
		opt.search = false;

		for (var i = 0; i < cols.length; i++) {
			var col = cols[i];

			if (typeof(col) === 'string') {
				opt.rowclasstemplate = Tangular.compile(col);
				cols.splice(i, 1);
				i--;
				continue;
			}

			col.id = GUID(5);
			col.realindex = i;

			if (!col.name)
				col.name = col.id;

			if (col.listcolumn == null)
				col.listcolumn = true;

			if (col.hidden) {
				col.$hidden = FN(col.hidden)(col) === true;
				col.hidden = true;
			}

			if (col.hide) {
				col.hidden = col.hide === true;
				delete col.hide;
			}

			if (col.options) {
				!col.otext && (col.otext = 'text');
				!col.ovalue && (col.ovalue = 'value');
			}

			// SORT?
			if (col.sort != null)
				col.sorting = col.sort;

			if (cache) {
				var c = cache[i];
				if (c) {
					col.index = c.index;
					col.width = c.width;
					col.hidden = c.hidden;
				}
			}

			if (col.index == null)
				col.index = i;

			if (col.sorting == null)
				col.sorting = config.sorting;

			if (col.alignfilter != null)
				col.alignfilter = ' ' + align(col.alignfilter);

			if (col.alignheader != null)
				col.alignheader = ' ' + align(col.alignheader);

			col.sort = 0;

			if (col.search) {
				opt.search = true;
				col.search = col.search === true ? Tangular.compile(col.template) : Tangular.compile(col.search);
			}

			if (col.align && col.align !== 'left') {
				col.align = align(col.align);
				col.align = ' ' + col.align;
				if (!col.alignfilter)
					col.alignfilter = ' center';
				if (!col.alignheader)
					col.alignheader = ' center';
			}

			var cls = col.class ? (' ' + col.class) : '';

			if (col.editable) {
				cls += ' dg-editable';
				if (col.required)
					cls += ' dg-required';
			}

			var isbool = col.type && col.type.substring(0, 4) === 'bool';
			var TC = Tangular.compile;

			if (col.template) {
				col.templatecustom = true;
				col.template = TC((col.template.indexOf('<button') === -1 ? ('<div class="dg-value' + cls + '">{0}</div>') : '{0}').format(col.template));
			} else
				col.template = TC(('<div class="' + (isbool ? 'dg-bool' : 'dg-value') + cls + '"' + (config.allowtitles ? ' title="{{ {0} }}"' : '') + '>{{ {0} }}</div>').format(col.name + (col.format != null ? ' | format({0}) '.format(typeof(col.format) === 'string' ? ('\'' + col.format + '\'') : col.format) : '') + (col.empty ? ' | def({0})'.format(col.empty === true || col.empty == '1' ? '' : ('\'' + col.empty + '\'')) : '') + (isbool ? ' | ui_datagrid_checkbox' : '')));

			if (col.header)
				col.header = TC(col.header);
			else
				col.header = TC('{{ text | raw }}');

			if (!col.text)
				col.text = col.name;

			if (col.text.substring(0, 1) === '.')
				col.text = '<i class="{0}"></i>'.format(col.text.substring(1));

			if (col.filter !== false && !col.filter)
				col.filter = config.filterlabel;

			if (col.filtervalue != null) {
				tmp = col.filtervalue;
				if (typeof(tmp) === 'function')
					tmp = tmp(col);
				opt.filter[col.name] = opt.filtervalues[col.id] = tmp;
			}
		}

		cols.quicksort('index');
		opt.cols = cols;
		self.rebindcss();

		// self.scrollbar.scroll(0, 0);
	};

	self.rebindcss = function() {

		var cols = opt.cols;
		var css = [];
		var indexes = {};

		opt.width = (config.numbering !== false ? 40 : 0) + (config.checkbox ? 40 : 0) + 30;

		for (var i = 0; i < cols.length; i++) {
			var col = cols[i];

			if (!col.width)
				col.width = config.colwidth;

			css.push('.dg-{2} .dg-col-{0}{width:{1}px}'.format(i, col.width, self.IDCSS));

			if (!col.hidden) {
				opt.width += col.width;
				indexes[i] = opt.width;
			}
		}

		CSS(css, self.ID);

		var w = self.width();
		if (w > opt.width)
			opt.width = w - 2;

		if (sheader) {
			css = { width: opt.width };
			header.css(css);
			// vbody.css(css);
		}

		header && header.find('.dg-resize').each(function() {
			var el = $(this);
			el.css('left', indexes[el.attrd('index')] - 39);
		});
	};

	self.cols = function(callback) {
		callback(opt.cols);
		opt.cols.quicksort('index');
		self.rebindcss();
		self.rendercols();
		opt.rows && self.renderrows(opt.rows);
		self.save();
		opt.cluster && opt.cluster.update(opt.render);
		self.resize();
	};

	self.rendercols = function() {

		var Trow = '<div class="dg-hrow dg-row-{0}">{1}</div>';
		var column = config.numbering !== false ? Theadercol({ index: -1, label: config.numbering, filter: false, name: '$', sorting: false }) : '';
		var resize = [];

		opt.width = (config.numbering !== false ? 40 : 0) + (config.checkbox ? 40 : 0) + 30;

		if (config.checkbox)
			column += Theadercol({ index: -1, label: '<div class="dg-checkbox dg-checkbox-main" data-value="-1"><i class="fa fa-check"></i></div>', filter: false, name: '$', sorting: false });

		for (var i = 0; i < opt.cols.length; i++) {
			var col = opt.cols[i];
			if (!col.hidden) {
				var filteritems = col.options ? col.options instanceof Array ? col.options : GET(col.options) : null;
				var filtervalue = opt.filtervalues[col.id];
				var obj = { index: i, ts: NOW.getTime(), label: col.header(col), filter: col.filter, reorder: config.reorder, sorting: col.sorting, name: col.name, alignfilter: col.alignfilter, alignheader: col.alignheader, filterval: filtervalue == null ? null : filteritems ? filteritems.findValue(col.ovalue, filtervalue, col.otext, '???') : filtervalue, labeltitle: col.title || col.text, options: filteritems };
				opt.width += col.width;
				config.resize && resize.push('<span class="dg-resize" style="left:{0}px" data-index="{1}"></span>'.format(opt.width - 39, i));
				column += Theadercol(obj);
			}
		}

		column += '<div class="dg-hcol"></div>';
		header[0].innerHTML = resize.join('') + Trow.format(0, column);

		var w = self.width();
		if (w > opt.width)
			opt.width = w;

		self.redrawsorting();
	};

	self.redraw = function(update) {
		var x = self.scrollbarX.scrollLeft();
		var y = self.scrollbarY.scrollTop();
		isredraw = update ? 2 : 1;
		self.refreshfilter();
		isredraw = 0;
		self.scrollbarX.scrollLeft(x);
		self.scrollbarY.scrollTop(y);
	};

	self.redrawrow = function(oldrow, newrow) {
		var index = opt.rows.indexOf(oldrow);
		if (index !== -1) {

			// Replaces old row with a new
			if (newrow) {
				if (self.selected === oldrow)
					self.selected = newrow;
				oldrow = opt.rows[index] = newrow;
			}

			var el = vbody.find('.dg-row[data-index="{0}"]'.format(index));
			if (el.length) {
				opt.render[index] = $(self.renderrow(index, oldrow))[0];
				el[0].parentNode.replaceChild(opt.render[index], el[0]);
			}
		}
	};

	self.appendrow = function(row, scroll, prepend) {

		var index = prepend ? 0 : (opt.rows.push(row) - 1);
		var model = self.get();

		if (model == null) {
			// bad
			return;
		} else {
			var arr = model.items ? model.items : model;
			if (prepend) {
				arr.unshift(row);
			} else if (model.items)
				arr.push(row);
			else
				arr.push(row);
		}

		if (prepend) {
			var tmp;
			// modifies all indexes
			for (var i = 0; i < opt.render.length; i++) {
				var node = opt.render[i];
				if (typeof(node) === 'string')
					node = opt.render[i] = $(node)[0];
				var el = $(node);
				var tmpindex = i + 1;
				tmp = el.rclass2('dg-row-').aclass('dg-row-' + tmpindex).attrd('index', tmpindex);
				tmp.find('.dg-number').html(tmpindex + 1);
				tmp.find('.dg-checkbox-main').attrd('value', tmpindex);
				if (opt.rows[i])
					opt.rows[i].ROW = tmpindex;
			}
			row.ROW = index;
			tmp = {};
			var keys = Object.keys(opt.checked);
			for (var i = 0; i < keys.length; i++)
				tmp[(+keys[i]) + 1] = 1;
			opt.checked = tmp;
			opt.render.unshift(null);
		}

		opt.render[index] = $(self.renderrow(index, row))[0];
		opt.cluster && opt.cluster.update(opt.render, !opt.scroll || opt.scroll === '-');
		if (scroll) {
			var el = opt.cluster.el[0];
			el.scrollTop = el.scrollHeight;
		}
		self.scrolling();
	};

	self.renderrow = function(index, row, plus) {

		if (plus === undefined && config.exec) {
			// pagination
			var val = self.get();
			plus = (val.page - 1) * val.limit;
		}

		var Trow = '<div><div class="dg-row dg-row-{0}{3}{4}" data-index="{2}">{1}</div></div>';
		var Tcol = '<div class="dg-col dg-col-{0}{2}{3}">{1}</div>';
		var column = '';

		if (config.numbering !== false)
			column += Tcol.format(-1, '<div class="dg-number">{0}</div>'.format(index + 1 + (plus || 0)));

		if (config.checkbox)
			column += Tcol.format(-1, '<div class="dg-checkbox-main dg-checkbox{1}" data-value="{0}"><i class="fa fa-check"></i></div>'.format(row.ROW, opt.checked[row.ROW] ? ' dg-checked' : ''));

		for (var j = 0; j < opt.cols.length; j++) {
			var col = opt.cols[j];
			if (!col.hidden)
				column += Tcol.format(j, col.template(row), col.align, row.CHANGES && row.CHANGES[col.name] ? ' dg-col-changed' : '');
		}

		column += '<div class="dg-col">&nbsp;</div>';
		var rowcustomclass = opt.rowclasstemplate ? opt.rowclasstemplate(row) : '';
		return Trow.format(index + 1, column, index, self.selected === row ? ' dg-selected' : '', (row.CHANGES ? ' dg-row-changed' : '') + (rowcustomclass || ''));
	};

	self.renderrows = function(rows, noscroll) {

		opt.rows = rows;

		var output = [];
		var plus = 0;

		if (config.exec) {
			// pagination
			var val = self.get();
			plus = (val.page - 1) * val.limit;
		}

		for (var i = 0, length = rows.length; i < length; i++)
			output.push(self.renderrow(i, rows[i], plus));

		var min = (((opt.height - 120) / config.rowheight) >> 0) + 1;
		var is = output.length < min;
		if (is) {
			for (var i = output.length; i < min + 1; i++)
				output.push('<div class="dg-row-empty">&nbsp;</div>');
		}

		self.tclass('dg-noscroll', is);

		if (noscroll) {
			self.scrollbarX.scrollLeft(0);
			self.scrollbarY.scrollTop(0);
		}

		opt.render = output;
		self.onrenderrows && self.onrenderrows(opt);
	};

	self.exportrows = function(page_from, pages_count, callback, reset_page_to, sleep) {

		var arr = [];
		var source = self.get();

		if (reset_page_to === true)
			reset_page_to = source.page;

		if (page_from === true)
			reset_page_to = source.page;

		pages_count = page_from + pages_count;

		if (pages_count > source.pages)
			pages_count = source.pages;

		for (var i = page_from; i < pages_count; i++)
			arr.push(i);

		!arr.length && arr.push(page_from);

		var index = 0;
		var rows = [];

		arr.wait(function(page, next) {
			opt.scroll = (index++) === 0 ? 'xy' : '';
			self.get().page = page;
			self.operation('page');
			self.onrenderrows = function(opt) {
				rows.push.apply(rows, opt.rows);
				setTimeout(next, sleep || 100);
			};
		}, function() {
			self.onrenderrows = null;
			callback(rows, opt);
			if (reset_page_to > 0) {
				self.get().page = reset_page_to;
				self.operation('page');
			}
		});
	};

	self.reordercolumn = function(index, position) {

		var col = opt.cols[index];
		if (!col)
			return;

		var old = col.index;

		opt.cols[index].index = position + (old < position ? 0.2 : -0.2);
		opt.cols.quicksort('index');

		for (var i = 0; i < opt.cols.length; i++) {
			col = opt.cols[i];
			col.index = i;
		}

		opt.cols.quicksort('index');

		self.rebindcss();
		self.rendercols();
		self.renderrows(opt.rows);
		opt.sort && opt.sort.sort && self.redrawsorting();
		opt.cluster && opt.cluster.update(opt.render, true);
		self.scrolling();

		config.remember && self.save();
	};

	self.resizecolumn = function(index, size) {
		opt.cols[index].width = size;
		self.rebindcss();
		config.remember && self.save();
		self.resize();
	};

	self.save = function() {

		var cache = {};

		for (var i = 0; i < opt.cols.length; i++) {
			var col = opt.cols[i];
			col.index = i;
			cache[col.realindex] = { index: col.index, width: col.width, hidden: col.hidden };
		}

		if (W.PREF)
			W.PREF.set(self.gridid, cache, '1 month');
		else
			CACHE(self.gridid, cache, '1 month');
	};

	self.rows = function() {
		return opt.rows.slice(0);
	};

	var resizecache = {};

	self.resize = function() {

		if (!opt.cols || HIDDEN(self.dom))
			return;

		var el;
		var footerh = opt.footer = footer.length ? footer.height() : 0;

		switch (config.height) {
			case 'auto':
				el = self.element;
				opt.height = (WH - (el.offset().top + config.margin));
				break;
			case 'window':
				opt.height = WH - config.margin;
				break;
			case 'parent':
				el = self.element.parent();
				opt.height = (el.height() - config.margin);
				break;
			default:
				if (config.height > 0) {
					opt.height = config.height;
				} else {
					el = self.element.closest(config.height);
					opt.height = ((el.length ? el.height() : 200) - config.margin);
				}
				break;
		}

		var mr = (vbody.parent().css('margin-right') || '').parseInt();
		var h = opt.height - footerh;
		var sh = SCROLLBARWIDTH();

		var ismobile = isMOBILE && isTOUCH;

		if (resizecache.mobile !== ismobile && !config.noborder) {
			resizecache.mobile = ismobile;
			self.tclass('dg-mobile', ismobile);
		}

		if (resizecache.h !== h) {
			resizecache.h = h;
			sheader.css('height', h);
		}

		var tmpsh = h - (sh ? (sh + self.scrollbarX.thinknessX - 2) : (footerh - 2));

		resizecache.tmpsh = h;
		sbody.css('height', tmpsh + self.scrollbarX.marginY + (config.exec && self.scrollbarX.size.empty ? footerh : 0));

		var w;

		if (config.fullwidth_xs && WIDTH() === 'xs' && isMOBILE) {
			var isfrm = false;
			try {
				isfrm = window.self !== window.top;
			} catch (e) {
				isfrm = true;
			}
			if (isfrm) {
				w = screen.width - (self.element.offset().left * 2);
				if (resizecache.wmd !== w) {
					resizecache.wmd = w;
					self.css('width', w);
				}
			}
		}

		if (w == null)
			w = self.width();

		var emptyspace = 50 - mr;
		if (emptyspace < 50)
			emptyspace = 50;

		var width = (config.numbering !== false ? 40 : 0) + (config.checkbox ? 40 : 0) + emptyspace;

		for (var i = 0; i < opt.cols.length; i++) {
			var col = opt.cols[i];
			if (!col.hidden)
				width += col.width + 1;
		}

		if (w > width)
			width = w - 2;

		if (resizecache.hc !== h) {
			resizecache.hc = h;
			container.css('height', h);
		}

		if (resizecache.width !== width) {
			resizecache.width = width;
			header.css('width', width);
			vbody.css('width', width);
			self.find('.dg-body-scrollbar').css('width', width);
			opt.width2 = w;
		}

		self.scrollbarX.resize();
		self.scrollbarY.resize();

		ready = true;
		// header.parent().css('width', self.scrollbar.area.width());
	};

	self.refreshfilter = function(useraction) {

		// Get data
		var obj = self.get() || EMPTYARRAY;
		var items = (obj instanceof Array ? obj : obj.items) || EMPTYARRAY;
		var output = [];

		if (isredraw) {
			if (isredraw === 2) {
				self.fn_in_checked();
				self.fn_in_changed();
			}
		} else {
			opt.checked = {};
			config.checkbox && header.find('.dg-checkbox-main').rclass('dg-checked');
			self.fn_in_checked(EMPTYARRAY);
		}

		for (var i = 0, length = items.length; i < length; i++) {
			var item = items[i];

			item.ROW = i;

			if (!config.exec) {
				if (opt.filter && !self.filter(item))
					continue;
				if (opt.search) {
					for (var j = 0; j < opt.cols.length; j++) {
						var col = opt.cols[j];
						if (col.search)
							item['$' + col.name] = col.search(item);
					}
				}
			}

			output.push(item);
		}

		if (!isredraw) {

			if (opt.scroll) {

				if ((/y/).test(opt.scroll))
					self.scrollbarY.scrollTop(0);

				if ((/x/).test(opt.scroll)) {
					if (useraction)	{
						var sl = self.scrollbarX.scrollLeft();
						self.scrollbarX.scrollLeft(sl ? sl - 1 : 0);
					} else
						self.scrollbarX.scrollLeft(0);
				}

				opt.scroll = '';
			}

			if (opt.sort != null) {
				if (!config.exec)
					opt.sort.sort && output.quicksort(opt.sort.name, opt.sort.sort === 1);
				self.redrawsorting();
			}
		}

		self.resize();
		self.renderrows(output, isredraw);

		setTimeout(self.resize, 100);
		opt.cluster && opt.cluster.update(opt.render, !opt.scroll || opt.scroll === '-');
		self.scrolling();

		if (isredraw) {
			if (isredraw === 2) {
				// re-update all items
				self.select(self.selected || null);
			}
		} else {
			var sel = self.selected;
			if (config.autoselect && output && output.length) {
				setTimeout(function() {
					self.select(sel ? output.findItem(config.clickid, sel.id) : output[0]);
				}, 1);
			} else if (opt.operation !== 'sort') {
				self.select(sel ? output.findItem(config.clickid, sel.id) : null);
			} else {
				var tmp = sel ? output.findItem(config.clickid, sel.id) : null;
				tmp && self.select(tmp);
			}
		}
	};

	self.redrawsorting = function() {
		self.find('.dg-sorting').each(function() {
			var el = $(this);
			var col = opt.cols[+el.attrd('index')];
			if (col) {
				var fa = el.find('.dg-sort').rclass2('fa-');
				switch (col.sort) {
					case 1:
						fa.aclass('fa-arrow-up');
						break;
					case 2:
						fa.aclass('fa-arrow-down');
						break;
					default:
						fa.aclass('fa-sort');
						break;
				}
			}
		});
	};

	self.resetcolumns = function() {

		if (W.PREF)
			W.PREF.set(self.gridid);
		else
			CACHE(self.gridid, null, '-1 day');

		self.rebind(opt.declaration);
		self.cols(NOOP);
		ecolumns.aclass('hidden');
		isecolumns = false;
	};

	self.resetfilter = function() {
		opt.filter = {};
		opt.filtercache = {};
		opt.filtercl = {};
		opt.filtervalues = {};
		opt.cols && self.rendercols();
		if (config.exec)
			self.operation('refresh');
		else
			self.refresh();
	};

	var pagecache = { pages: -1, count: -1 };

	self.redrawpagination = function() {

		if (!config.exec)
			return;

		var value = self.get();
		var is = false;

		if (value.page === 1 || (value.pages != null && value.count != null)) {
			pagecache.pages = value.pages;
			pagecache.count = value.count;
			is = true;
		}

		footer.find('button').each(function() {

			var el = $(this);
			var dis = true;

			switch (this.name) {
				case 'page-next':
					dis = value.page >= pagecache.pages;
					break;
				case 'page-prev':
					dis = value.page === 1;
					break;
				case 'page-last':
					dis = !value.page || value.page === pagecache.pages;
					break;
				case 'page-first':
					dis = value.page === 1;
					break;
			}

			el.prop('disabled', dis);
		});

		footer.find('input')[0].value = value.page;

		if (is) {
			var num = pagecache.pages || 0;
			footer.find('.dg-pagination-pages')[0].innerHTML = num.pluralize.apply(num, config.pluralizepages);
			num = pagecache.count || 0;
			footer.find('.dg-pagination-items')[0].innerHTML = num.pluralize.apply(num, config.pluralizeitems);
		}

		footer.rclass('hidden');
	};

	self.setter = function(value, path, type) {

		if (!ready) {
			setTimeout(self.setter, 100, value, path, type);
			return;
		}

		if (config.exec && value == null) {
			self.operation('refresh');
			return;
		}

		if (value && value.schema && schemas.$current !== value.schema) {
			schemas.$current = value.schema;
			self.rebind(value.schema);
			setTimeout(function() {
				self.setter(value, path, type);
			}, 100);
			return;
		}

		if (!opt.cols)
			return;

		opt.checked = {};

		if (forcescroll) {
			opt.scroll = forcescroll;
			forcescroll = '';
		} else
			opt.scroll = type !== 'noscroll' ? 'xy' : '';

		self.applycolumns();
		self.refreshfilter();
		self.redrawsorting();
		self.redrawpagination();
		self.fn_in_changed();
		!config.exec && self.rendercols();
		setTimeout2(self.ID + 'resize', self.resize, 100);

		if (opt.cluster)
			return;

		config.exec && self.rendercols();
		opt.cluster = new Cluster(vbody);
		opt.cluster.grid = self;
		opt.cluster.scroll = self.scrolling;
		opt.render && opt.cluster.update(opt.render);
		self.aclass('dg-visible');
	};

	self.scrolling = function() {
		config.checkbox && setTimeout2(self.ID, function() {
			vbody.find('.dg-checkbox-main').each(function() {
				$(this).tclass('dg-checked', opt.checked[this.getAttribute('data-value')] == 1);
			});
		}, 80, 10);
	};

	var REG_STRING = /\/\|\\|,/;
	var REG_DATE1 = /\s-\s/;
	var REG_DATE2 = /\/|\||\\|,/;
	var REG_SPACE = /\s/g;

	self.filter = function(row) {
		var keys = Object.keys(opt.filter);
		for (var i = 0; i < keys.length; i++) {

			var column = keys[i];
			var filter = opt.filter[column];
			var val2 = opt.filtercache[column];
			var val = row['$' + column] || row[column];
			var type = typeof(val);

			if (val instanceof Array) {
				val = val.join(' ');
				type = 'string';
			} else if (val && type === 'object' && !(val instanceof Date)) {
				val = JSON.stringify(val);
				type = 'string';
			}

			if (type === 'number') {

				if (val2 == null)
					val2 = opt.filtercache[column] = self.parseNumber(filter);

				if (val2.length === 1 && val !== val2[0])
					return false;

				if (val < val2[0] || val > val2[1])
					return false;

			} else if (type === 'string') {

				var is = false;

				if (opt.filtercl[column] != null) {
					is = opt.filtercl[column] == val;
					return is;
				}

				if (val2 == null) {
					val2 = opt.filtercache[column] = filter.split(REG_STRING).trim();
					for (var j = 0; j < val2.length; j++)
						val2[j] = val2[j].toSearch();
				}

				var s = val.toSearch();

				for (var j = 0; j < val2.length; j++) {
					if (s.indexOf(val2[j]) !== -1) {
						is = true;
						break;
					}
				}

				if (!is)
					return false;

			} else if (type === 'boolean') {
				if (val2 == null)
					val2 = opt.filtercache[column] = typeof(filter) === 'string' ? config.boolean.indexOf(filter.replace(REG_SPACE, '')) !== -1 : filter;
				if (val2 !== val)
					return false;
			} else if (val instanceof Date) {

				val.setHours(0);
				val.setMinutes(0);

				if (val2 == null) {

					val2 = filter.trim().replace(REG_DATE1, '/').split(REG_DATE2).trim();
					var arr = opt.filtercache[column] = [];

					for (var j = 0; j < val2.length; j++) {
						var dt = val2[j].trim();
						var a = self.parseDate(dt, j === 1);
						if (a instanceof Array) {
							if (val2.length === 2) {
								arr.push(j ? a[1] : a[0]);
							} else {
								arr.push(a[0]);
								if (j === val2.length - 1) {
									arr.push(a[1]);
									break;
								}
							}
						} else
							arr.push(a);
					}

					if (val2.length === 2 && arr.length === 2) {
						arr[1].setHours(23);
						arr[1].setMinutes(59);
						arr[1].setSeconds(59);
					}

					val2 = arr;
				}

				if (val2.length === 1) {
					if (val2[0].YYYYMM)
						return val.format('yyyyMM') === val2[0].format('yyyyMM');
					if (val.format('yyyyMMdd') !== val2[0].format('yyyyMMdd'))
						return false;
				}

				if (val < val2[0] || val > val2[1])
					return false;

			} else
				return false;
		}

		return true;
	};

	self.checked = function() {
		var arr = Object.keys(opt.checked);
		var output = [];
		var model = self.get() || EMPTYARRAY;
		var rows = model instanceof Array ? model : model.items;
		for (var i = 0; i < arr.length; i++) {
			var index = +arr[i];
			output.push(rows[index]);
		}
		return output;
	};

	self.readfilter = function() {
		return opt.filter;
	};

	self.changed = function() {
		var output = [];
		var model = self.get() || EMPTYARRAY;
		var rows = model instanceof Array ? model : model.items;
		for (var i = 0; i < rows.length; i++)
			rows[i].CHANGES && output.push(rows[i]);
		return output;
	};

	self.parseDate = function(val, second) {

		var index = val.indexOf('.');
		var m, y, d, a, special, tmp;

		if (index === -1) {
			if ((/[a-z]+/).test(val)) {
				var dt;
				try {
					dt = NOW.add(val);
				} catch (e) {
					return [0, 0];
				}
				return dt > NOW ? [NOW, dt] : [dt, NOW];
			}
			if (val.length === 4)
				return [new Date(+val, 0, 1), new Date(+val + 1, 0, 1)];
		} else if (val.indexOf('.', index + 1) === -1) {
			a = val.split('.');
			if (a[1].length === 4) {
				y = +a[1];
				m = +a[0] - 1;
				d = second ? new Date(y, m, 0).getDate() : 1;
				special = true;
			} else {
				y = NOW.getFullYear();
				m = +a[1] - 1;
				d = +a[0];
			}

			tmp = new Date(y, m, d);
			if (special)
				tmp.YYYYMM = true;
			return tmp;
		}
		index = val.indexOf('-');
		if (index !== -1 && val.indexOf('-', index + 1) === -1) {
			a = val.split('-');
			if (a[0].length === 4) {
				y = +a[0];
				m = +a[1] - 1;
				d = second ? new Date(y, m, 0).getDate() : 1;
				special = true;
			} else {
				y = NOW.getFullYear();
				m = +a[0] - 1;
				d = +a[1];
			}

			tmp = new Date(y, m, d);

			if (special)
				tmp.YYYYMM = true;

			return tmp;
		}

		return val.parseDate();
	};

	var REG_NUM1 = /\s-\s/;
	var REG_COMMA = /,/g;
	var REG_NUM2 = /\/|\|\s-\s|\\/;

	self.parseNumber = function(val) {
		var arr = [];
		var num = val.replace(REG_NUM1, '/').replace(REG_SPACE, '').replace(REG_COMMA, '.').split(REG_NUM2).trim();
		for (var i = 0, length = num.length; i < length; i++) {
			var n = num[i];
			arr.push(+n);
		}
		return arr;
	};

	self.datagrid_cancel = function(meta, force) {
		var current = self.editable;
		if (current && current.is) {
			current.is = false;
			force && current.el.replaceWith(current.backup);
			current.input.off();
			$(W).off('keydown', current.fn).off('click', current.fn);
		}
	};

	self.datagrid_edit = function(meta, next) {

		if (!meta || !meta.col.editable)
			return;

		if (!self.editable)
			self.editable = {};

		var el = meta.elcol;
		var current = self.editable;
		current.is && self.datagrid_cancel(meta, true);
		current.is = true;

		current.backup = el.find('.dg-editable').aclass('dg-editable').clone();
		el = el.find('.dg-editable');

		if (!meta.col.type) {
			if (meta.value instanceof Date)
				meta.col.type = 'date';
			else
				meta.col.type = typeof(meta.value);
		}

		if (meta.col.options) {
			current.el = el;
			var opt = {};
			opt.element = el;
			opt.items = meta.col.options;
			opt.key = meta.col.otext;
			opt.placeholder = meta.col.dirsearch ? meta.col.dirsearch : '';
			if (meta.col.dirsearch === false)
				opt.search = false;
			opt.callback = function(item) {
				current.is = false;
				meta.value = item[meta.col.ovalue];
				next(meta);
				self.datagrid_cancel(meta);
			};
			SETTER('directory', 'show', opt);
			return;
		}

		var align = meta.col.align;
		el.rclass('dg-value').html(meta.col.type.substring(0, 4) === 'bool' ? '<div{1}><div class="dg-checkbox{0}" data-custom="2"><i class="fa fa-check"></i></div></div>'.format(meta.value ? ' dg-checked' : '', align ? (' class="' + align.trim() + '"') : '') : '<input type="{0}" maxlength="{1}"{2} />'.format(meta.col.ispassword ? 'password' : 'text', meta.col.maxlength || 100, align ? (' class="' + align.trim() + '"') : ''));
		current.el = el;

		var input = meta.elcol.find('input');
		input.val(meta.value instanceof Date ? meta.value.format(meta.col.format) : meta.value);
		input.focus();
		current.input = input;

		if (meta.col.type === 'date') {
			// DATE
			var opt = {};
			opt.element = el;
			opt.value = meta.value;
			opt.callback = function(date) {
				current.is = false;
				meta.value = date;
				next(meta);
				self.datagrid_cancel(meta);
			};
			SETTER('datepicker', 'show', opt);
		}

		current.fn = function(e) {

			if (!current.is)
				return;

			if (e.type === 'click') {
				if (e.target.tagName === 'INPUT')
					return;
				e.preventDefault();
				e.keyCode = 13;
				if (meta.col.type === 'date') {
					e.type = 'keydown';
					setTimeout(current.fn, 800, e);
					return;
				} else if (meta.col.type.substring(0, 4) === 'bool') {
					var tmp = $(e.target);
					var is = tmp.hclass('dg-checkbox');
					if (!is) {
						tmp = tmp.closest('.dg-checkbox');
						is = tmp.length;
					}
					if (is) {
						meta.value = tmp.hclass('dg-checked');
						next(meta);
						self.datagrid_cancel(meta);
						return;
					}
				}
			}

			switch (e.keyCode) {
				case 13: // ENTER
				case 9: // TAB

					var val = input.val();
					if (val == meta.value) {
						next = null;
						self.datagrid_cancel(meta, true);
					} else {

						if (meta.col.type === 'number') {
							val = val.parseFloat();
							if (val == meta.value || (meta.min != null && meta.min > val) || (meta.max != null && meta.max < val)) {
								next = null;
								self.datagrid_cancel(meta, true);
								return;
							}
						} else if (meta.col.type === 'date') {

							val = val.parseDate(meta.format ? meta.format.env() : undefined);

							if (!val || isNaN(val.getTime()))
								val = null;

							if (val && meta.value && val.getTime() === meta.value.getTime()) {
								next = null;
								self.datagrid_cancel(meta, true);
								return;
							}
						}

						if (meta.col.required && (val == null || val === '')) {
							// WRONG VALUE
							self.datagrid_cancel(meta, true);
							return;
						}

						meta.value = val;
						next(meta);
						self.datagrid_cancel(meta);
					}

					if (e.which === 9) {

						// tries to edit another field
						var elcol = meta.elcol;

						while (true) {
							elcol = elcol.next();
							if (!elcol.length)
								break;

							var eledit = elcol.find('.dg-editable');
							if (eledit.length) {
								setTimeout(function() {
									self.editcolumn(meta.rowindex, +elcol.attr('class').match(/\d+/)[0]);
								}, 200);
								break;
							}
						}
					}

					break;

				case 27: // ESC
					next = null;
					self.datagrid_cancel(meta, true);
					break;
			}
		};

		$(W).on('keydown', current.fn).on('click', current.fn);
	};
});

COMPONENT('lazyload', 'offset:50', function(self, config) {

    var is = null;
    var container = $(W);

    self.readonly();

    self.configure = function(key, value) {
        if (key === 'container') {
            container.off('scroll', self.refresh);
            container = $(value);
            is = container[0] === W;
            container.on('scroll', self.refresh);
        }
    };

    self.make = function() {
        is = true;
        container.on('scroll', self.refresh);
        setTimeout(self.refresh, 1000);
    };

    self.refresh = function() {
        !self.release() && setTimeout2(self.id, self.prepare, 200);
    };

    self.released = self.refresh;
    self.setter = self.refresh;

    self.prepare = function() {
        var scroll = container.scrollTop();
        var beg = scroll;
        var end = beg + container.height();
        var off = config.offset;
        self.find(config.selector).each(function() {
            if (!this.getAttribute('data-lazyload')) {
                var el = $(this);
                var top = (is ? 0 : scroll) + el.offset().top;
                if ((top + off) >= beg && (top - off) <= end) {
                    el.attrd('lazyload', true);
                    config.exec && EXEC(config.exec, el);
                }
            }
        });
    };
});