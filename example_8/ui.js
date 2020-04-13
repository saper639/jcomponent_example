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
/*table*/
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
            console.log('****');            
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
                        self.operation('page');
                        break;
                    case 'page-last':
                        var tmp = model;
                        tmp.page = tmp.pages;
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
        console.log('***');     
        if (!config.paginate)
            return;
        console.log('*****');     
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
/*Grid*/
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