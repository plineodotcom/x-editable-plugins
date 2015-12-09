(function ($) {
    "use strict";
    
    var Date = function (options) {
        this.init('date', options, Date.defaults);
        this.initPicker(options, Date.defaults);
    };

    $.fn.editableutils.inherit(Date, $.fn.editabletypes.abstractinput);    
    
    $.extend(Date.prototype, {
        initPicker: function(options, defaults) {
            //'format' is set directly from settings or data-* attributes

            //by default viewformat equals to format
            if(!this.options.viewFormat) {
                this.options.viewFormat = this.options.format;
            }
            
            //try parse datepicker config defined as json string in data-datepicker
            options.datepicker = $.fn.editableutils.tryParseJson(options.datepicker, true);
            
            //overriding datepicker config (as by default jQuery extend() is not recursive)
            //since 1.4 datepicker internally uses viewformat instead of format. Format is for submit only
            this.options.datepicker = $.extend({}, defaults.datepicker, options.datepicker, {
                format: this.options.format
            });

            //store parsed formats
            this.parsedFormat = this.options.format;
            this.parsedViewFormat = this.options.viewFormat;
        },
        
        render: function () {
            this.$input.datetimepicker(this.options.datepicker);
            
            //"clear" link
            if(this.options.clear) {
                this.$clear = $('<a href="#"></a>').html(this.options.clear).click($.proxy(function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    this.clear();
                }, this));
                
                this.$tpl.parent().append($('<div class="editable-clear">').append(this.$clear));  
            }                
        },
        
        value2html: function(value, element) {
            var text = value ? $.fn.chronos.formatDate(value, this.parsedViewFormat) : '';
            Date.superclass.value2html.call(this, text, element); 
        },

        html2value: function(html) {
            return $.fn.chronos.parse(html, this.parsedFormat);
        },   

        value2str: function(value) {
            return value ? $.fn.chronos.formatDate(value, this.parsedFormat) : '';
        }, 

        str2value: function(str) {
            return $.fn.chronos.parse(str, this.parsedFormat);
        }, 

        value2submit: function(value) {
            return this.value2str(value);
        },                    

        value2input: function(value) {
            this.$input.datetimepicker('update', value);
        },

        input2value: function() { 
            return this.$input.data('datepicker').date;
        },       

        activate: function() {
        },

        clear:  function() {
            this.$input.data('datepicker').date = null;
            this.$input.find('.active').removeClass('active');
            if(!this.options.showbuttons) {
                this.$input.closest('form').submit(); 
            }
        },

        autosubmit: function() {
            this.$input.on('mouseup', '.day', function(e){
                if($(e.currentTarget).is('.old') || $(e.currentTarget).is('.new')) {
                    return;
                }
                var $form = $(this).closest('form');
                setTimeout(function() {
                    $form.submit();
                }, 200);
            });
           //changedate is not suitable as it triggered when showing datepicker. see #149
           /*
           this.$input.on('changeDate', function(e){
               var $form = $(this).closest('form');
               setTimeout(function() {
                   $form.submit();
               }, 200);
           });
           */
       },
       
       /*
        For incorrect date bootstrap-datepicker returns current date that is not suitable
        for datefield.
        This function returns null for incorrect date.  
       */
       parseDate: function(str, format) {
           var date = null, formattedBack;
           if(str) {
               date = $.fn.chronos.parse(str, format);
               if(typeof str === 'string') {
                   formattedBack = $.fn.chronos.formatDate(date, format);
                   if(str !== formattedBack) {
                       date = null;
                   }
               }
           }
           return date;
       }

    });

    Date.defaults = $.extend({}, $.fn.editabletypes.abstractinput.defaults, {
        /**
        @property tpl 
        @default <div></div>
        **/         
        tpl:'<div class="editable-date well"></div>',
        /**
        @property inputclass 
        @default null
        **/
        inputclass: null,
        /**
        Format used for sending value to server. Also applied when converting date from <code>data-value</code> attribute.<br>
        Possible tokens are: <code>d, dd, m, mm, yy, yyyy</code>  

        @property format 
        @type string
        @default yyyy-mm-dd
        **/
        format:'DD/MM/YYYY',
        /**
        Format used for displaying date. Also applied when converting date from element's text on init.   
        If not specified equals to <code>format</code>

        @property viewformat 
        @type string
        @default null
        **/
        viewformat: null,
        /**
        Configuration of datepicker.
        Full list of options: http://bootstrap-datepicker.readthedocs.org/en/latest/options.html

        @property datepicker 
        @type object
        @default {
            weekStart: 0,
            startView: 0,
            minViewMode: 0,
            autoclose: false
        }
        **/
        datepicker:{
            //format: $.fn.chronos.getFormat('short'),
            icons: {
                time: 'fa fa-clock-o',
                date: 'fa fa-calendar',
                up: 'fa fa-chevron-up',
                down: 'fa fa-chevron-down',
                previous: 'fa fa-chevron-left',
                next: 'fa fa-chevron-right',
                today: 'fa fa-crosshairs',
                clear: 'fa fa-trash',
                close: 'fa fa-times'
            }
        },
        /**
        Text shown as clear date button. 
        If <code>false</code> clear button will not be rendered.

        @property clear 
        @type boolean|string
        @default 'x clear'
        **/
        clear: '&times; clear'
    });

    $.fn.editabletypes.date = Date;

}(window.jQuery));

/**
Bootstrap datefield input - modification for inline mode.
Shows normal <input type="text"> and binds popup datepicker.  
Automatically shown in inline mode.

@class datefield
@extends date

@since 1.4.0
**/
(function ($) {
    "use strict";
    
    var DateField = function (options) {
        if (!options.format)
            options.format = $.fn.chronos.getFormat('short');
        this.init('datefield', options, DateField.defaults);
        this.initPicker(options, DateField.defaults);
    };

    $.fn.editableutils.inherit(DateField, $.fn.editabletypes.date);    
    
    $.extend(DateField.prototype, {
        render: function () {
            this.$input = this.$tpl.find('input');
            this.setClass();
            this.setAttr('placeholder');
            if (!this.options.datepicker.format)
                this.options.datepicker.format = $.fn.chronos.getFormat('short');
            
            //bootstrap-datepicker is set `bdateicker` to exclude conflict with jQuery UI one. (in date.js)        
            this.$datetimepicker = this.$tpl.find('.date');
            
            if (this.options.datepicker.earlierThan) {
                var earlierThan = this.options.datepicker.earlierThan;
                delete this.options.datepicker['earlierThan'];
            }
            if (this.options.datepicker.laterThan) {
                var laterThan = this.options.datepicker.laterThan;
                delete this.options.datepicker['laterThan'];
                this.options.datepicker.useCurrent = false;
            }
            
            this.$datetimepicker.datetimepicker(this.options.datepicker);

            if (earlierThan) {
                var self = this;
                setTimeout(function(){
                    if (self.$datetimepicker.data('DateTimePicker').date())
                        $('#'+earlierThan).parent().find('.date').data('DateTimePicker').minDate(self.$datetimepicker.data('DateTimePicker').date());
                    self.$datetimepicker.on('dp.change',function(e){
                        $('#'+earlierThan).parent().find('.date').data('DateTimePicker').minDate(e.date);
                    });
                },100);
            }
            if (laterThan) {
                var self = this;
                setTimeout(function(){
                    if (self.$datetimepicker.data('DateTimePicker').date())
                        $('#'+laterThan).parent().find('.date').data('DateTimePicker').maxDate(self.$datetimepicker.data('DateTimePicker').date());
                    self.$datetimepicker.on('dp.change',function(e){
                        $('#'+laterThan).parent().find('.date').data('DateTimePicker').maxDate(e.date);
                    });
                },100);
            }

            //need to disable original event handlers
            this.$input.off('focus keydown');
            
            //update value of datepicker
            /*this.$input.keyup($.proxy(function(){
               this.$tpl.removeData('date');
               this.$tpl.datetimepicker('update');
            }, this));*/
            
        },   
        
       value2input: function(value) {
           //this.$input.val(value ? $.fn.chronos.formatDate(value, this.parsedViewFormat) : '');
           this.$datetimepicker.data('DateTimePicker').date(value ? $.fn.chronos.formatDate(value, this.parsedViewFormat) : '');
           //this.$tpl.datetimepicker('update');
       },
        
       input2value: function() { 
           return this.html2value(this.$input.val());
       },              
        
       activate: function() {
           $.fn.editabletypes.text.prototype.activate.call(this);
       },
       
       autosubmit: function() {
         //reset autosubmit to empty  
       }
    });
    
    DateField.defaults = $.extend({}, $.fn.editabletypes.date.defaults, {
        /**
        @property tpl 
        **/         
        //tpl:'<div class="input-append date"><input type="text"/><span class="add-on"><i class="icon-th"></i></span></div>',
        tpl:'<div class="form-group"><div class="input-group date"><input type="text" class="form-control" /><span class="input-group-addon"><span class="fa fa-calendar"></span></span></div></div>',
        /**
        @property inputclass 
        @default 'input-small'
        **/         
        inputclass: 'input-small',
        
        /* datepicker config */
        datepicker: {
            //format: $.fn.chronos.getFormat('short'),
            icons: {
                time: 'fa fa-clock-o',
                date: 'fa fa-calendar',
                up: 'fa fa-chevron-up',
                down: 'fa fa-chevron-down',
                previous: 'fa fa-chevron-left',
                next: 'fa fa-chevron-right',
                today: 'fa fa-crosshairs',
                clear: 'fa fa-trash',
                close: 'fa fa-times'
            }
        }
    });
    
    $.fn.editabletypes.datefield = DateField;
    $.fn.editabletypes.datetimefield = DateField;

}(window.jQuery));
