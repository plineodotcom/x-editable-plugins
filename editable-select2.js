/**
 * Extends the select2 plugin from x-editable (https://vitalets.github.io/x-editable/index.html) for fixes and updates
 */
(function ($) {
    "use strict";
    
    var Constructor = function (options) {
        this.init('select2', options, Constructor.defaults);

        options.select2 = options.select2 || {};

        this.sourceData = null;
        
        //placeholder
        if(options.placeholder) {
            options.select2.placeholder = options.placeholder;
        }
        this.isRemote = false;

        //if not `tags` mode, use source
        if(!options.select2.tags && options.source) {
            var source = options.source;
            //if source is function, call it (once!)
            if ($.isFunction(options.source)) {
                source = options.source.call(options.scope);
            }               

            if (typeof source === 'string') {
                //Initialize a bloodhound service and use it as a data source
                var filter = null;
                if (options.select2.filter) {
                    filter = options.select2.filter;
                    delete options.select2['filter'];
                }
                var bloodhound = new Bloodhound({
                    remote:{
                        url: source+'&q=%QUERY',
                        wildcard: '%QUERY',
                        prepare: function (query, settings) {
                            settings.url = settings.url.replace('%QUERY',query);
                            if (typeof filter === 'string' ) {
                                settings.url += '&' + filter;
                            } else if (typeof filter === 'function' ) {
                                settings.url += '&' + filter(query);
                            }
                            return settings;
                        }
                    },
                    sufficient: 10,
                    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
                    queryTokenizer: Bloodhound.tokenizers.whitespace,
                });
                var self = this;
                $.fn.select2.amd.require([
                      'select2/data/array',
                      'select2/utils'
                    ], function (ArrayData, Utils) {
                    var DP = function($element, options) {
                        DP.__super__.constructor.call(this, $element, options);
                    };
                    Utils.Extend(DP, ArrayData);
                    DP.prototype.query = function (params, callback) {
                        bloodhound.search(params.term, function(results) {
                            callback({results:results});
                        }, function (results) {
                            callback({results:results});
                        });
                    };
                    if (options.select2.formatResult)
                        DP.prototype.formatResult = options.select2.formatResult;
                    self.options.select2.dataAdapter = DP;
                });
                /*options.select2.ajax = options.select2.ajax || {};
                //some default ajax params
                if(!options.select2.ajax.data) {
                    options.select2.ajax.data = function(term) {return { query:term };};
                }
                if(!options.select2.ajax.results) {
                    options.select2.ajax.results = function(data) { return {results:data };};
                }
                options.select2.ajax.url = source;*/
                this.isRemote = true;
            } else {
                //check format and convert x-editable format to select2 format (if needed)
                this.sourceData = this.convertSource(source);
                options.select2.data = this.sourceData;
            }
        } 
        options.select2.escapeMarkup = function(result){return result;};
        //Handle templating functions
        if (options.select2.templateResult) {
            options.select2.escapeMarkup = function(result){return result;};
            if (!options.select2.templateSelection) {
                options.select2.templateSelection = options.select2.templateResult;
            }
        }

        //overriding objects in config (as by default jQuery extend() is not recursive)
        this.options.select2 = $.extend({}, Constructor.defaults.select2, options.select2);

        //detect whether it is multi-valued
        this.isMultiple = this.options.select2.tags || this.options.select2.multiple;
        //this.isRemote = ('ajax' in this.options.select2);

        //store function returning ID of item
        //should be here as used inautotext for local source
        this.idFunc = this.options.select2.id;
        if (typeof(this.idFunc) !== "function") {
            var idKey = this.idFunc || 'id';
            this.idFunc = function (e) { return e[idKey]; };
        }

        //store function that renders text in select2
        this.formatSelection = this.options.select2.formatSelection;
        if (typeof(this.formatSelection) !== "function") {
            this.formatSelection = function (e) { return e.text; };
        }
    };

    $.fn.editableutils.inherit(Constructor, $.fn.editabletypes.abstractinput);

    $.extend(Constructor.prototype, {
        render: function() {
            this.setClass();

            //can not apply select2 here as it calls initSelection 
            //over input that does not have correct value yet.
            //apply select2 only in value2input
            //this.$input.select2(this.options.select2);

            //when data is loaded via ajax, we need to know when it's done to populate listData
            if(this.isRemote) {
                //listen to loaded event to populate data
                this.$input.on('select2-loaded', $.proxy(function(e) {
                    this.sourceData = e.items.results;
                }, this));
            }

            //trigger resize of editableform to re-position container in multi-valued mode
            if(this.isMultiple) {
               this.$input.on('change', function() {
                   $(this).closest('form').parent().triggerHandler('resize');
               });
            }

            //In case we have a defined map, apply the additional fields
            if (this.options.select2.map) {
                var map = this.options.select2.map;
                this.$input.on('change', function() {
                    var data = $(this).select2('data')[0];
                    for (var x in map) {
                        if (data)
                            $(map[x]).val(data[x]);
                        else 
                            $(map[x]).val('');
                    }
                });
            }
            //Attach change event if needed
            if (typeof(this.options.select2.change) === 'function') {
                this.$input.on('change', this.options.select2.change);
            }
       },

       value2html: function(value, element) {
           var text = '', data,
               that = this;

           if(this.options.select2.tags) { //in tags mode just assign value
              data = value; 
              //data = $.fn.editableutils.itemsByValue(value, this.options.select2.tags, this.idFunc);
           } else if(this.sourceData) {
              data = $.fn.editableutils.itemsByValue(value, this.sourceData, this.idFunc); 
           } else {
                //can not get list of possible values 
                //(e.g. autotext for select2 with ajax source)
                var sdata = this.$input.select2('data');
                this.currentInput = this.$input.clone();
                this.currentSelection = sdata;
                var data = [];
                for (var i = 0; i < sdata.length; i ++) {
                    if (typeof this.options.select2.templateSelection === 'function') {
                        data.push(this.options.select2.templateSelection(sdata[i]));
                    } else {
                        data.push(sdata[i].text);
                    }
                }
           }

           //data may be array (when multiple values allowed)
           if($.isArray(data)) {
               //collect selected data and show with separator
               text = [];
               $.each(data, function(k, v){
                   text.push(v && typeof v === 'object' ? that.formatSelection(v) : v);
               });
           } else if(data) {
               text = that.formatSelection(data);
           }

           text = $.isArray(text) ? text.join(this.options.viewseparator) : text;

           //$(element).text(text);
           Constructor.superclass.value2html.call(this, text, element); 
       },

       html2value: function(html) {
           return this.options.select2.tags ? this.str2value(html, this.options.viewseparator) : null;
       },

       value2input: function(value) {
            if (this.currentInput) {
                this.$input.children('option').remove();
                this.currentInput.children('option').appendTo(this.$input);
            }
            if (this.currentSelection) {
                this.options.select2.initSelection = this.currentSelection;
            }
            this.currentSelection = null;
            this.currentInput = null;
            
            // if value array => join it anyway
            if($.isArray(value)) {
              value = value.join(this.getSeparator());
            }

            //for remote source just set value, text is updated by initSelection
            if(!this.$input.data('select2')) {
               this.$input.val(value);
               this.$input.select2(this.options.select2);
            } else {
               //second argument needed to separate initial change from user's click (for autosubmit)   
               this.$input.val(value).trigger('change', true); 

               //Uncaught Error: cannot call val() if initSelection() is not defined
               //this.$input.select2('val', value);
            }

            // if defined remote source AND no multiple mode AND no user's initSelection provided --> 
            // we should somehow get text for provided id.
            // The solution is to use element's text as text for that id (exclude empty)
            if(this.isRemote && !this.isMultiple && !this.options.select2.initSelection) {
               // customId and customText are methods to extract `id` and `text` from data object
               // we can use this workaround only if user did not define these methods
               // otherwise we cant construct data object
               var customId = this.options.select2.id,
                   customText = this.options.select2.formatSelection;

               if(!customId && !customText) {
                   var $el = $(this.options.scope);
                   if (!$el.data('editable').isEmpty) {
                       var data = {id: value, text: $el.text()};
                       this.$input.select2('data', data);
                   }
               }
            }
       },
       
       input2value: function() { 
            var data = this.$input.select2('data');
            var value = [];
            for (var i = 0; i < data.length; i ++) {
                value.push(data[i].id);
            }
            return value;
           return this.$input.select2('val');
       },

       str2value: function(str, separator) {
            if(typeof str !== 'string' || !this.isMultiple) {
                return str;
            }

            separator = separator || this.getSeparator();

            var val, i, l;

            if (str === null || str.length < 1) {
                return null;
            }
            val = str.split(separator);
            for (i = 0, l = val.length; i < l; i = i + 1) {
                val[i] = $.trim(val[i]);
            }

            return val;
       },

        autosubmit: function() {
            /*this.$input.on('change', function(e, isInitial){
                if(!isInitial) {
                  $(this).closest('form').submit();
                }
            });*/
        },

        getSeparator: function() {
            return this.options.select2.separator || $.fn.select2.defaults.separator;
        },

        /*
        Converts source from x-editable format: {value: 1, text: "1"} to
        select2 format: {id: 1, text: "1"}
        */
        convertSource: function(source) {
            if($.isArray(source) && source.length && source[0].value !== undefined) {
                for(var i = 0; i<source.length; i++) {
                    if(source[i].value !== undefined) {
                        source[i].id = source[i].value;
                        delete source[i].value;
                    }
                }
            }
            return source;
        },
        
        destroy: function() {
            if(this.$input.data('select2')) {
                this.$input.select2('destroy');
            }
        }
        
    });

    Constructor.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
        /**
        @property tpl 
        @default <input type="hidden">
        **/
        tpl:'<input type="hidden">',
        /**
        Configuration of select2. [Full list of options](http://ivaynberg.github.com/select2).

        @property select2 
        @type object
        @default null
        **/
        select2: null,
        /**
        Placeholder attribute of select

        @property placeholder 
        @type string
        @default null
        **/
        placeholder: null,
        /**
        Source data for select. It will be assigned to select2 `data` property and kept here just for convenience.
        Please note, that format is different from simple `select` input: use 'id' instead of 'value'.
        E.g. `[{id: 1, text: "text1"}, {id: 2, text: "text2"}, ...]`.

        @property source 
        @type array|string|function
        @default null        
        **/
        source: null,
        /**
        Separator used to display tags.

        @property viewseparator 
        @type string
        @default ', '        
        **/
        viewseparator: ', ',

        escape: false,
    });

    $.fn.editabletypes.select2 = Constructor;

}(window.jQuery))
