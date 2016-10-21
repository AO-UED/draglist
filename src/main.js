//jianqing

;(function($){

    var methods = {

        //function
        destroy: function(){},
        disable: function(){},
        enable: function(){},
        getOption: function(){},
        add: function(){},
        delete: function(){},
        edit: function(){},

        //event
        create: function(){},
        drag: function(){},
        start: function(){},
        stop: function(){},
        selected: function(){}
    };

    $.fn.Draglist = function(option,methods){
        this.VERSION = '1.0.0';

        //option
        this.option ={
            type: option.type || '',
            disable: option.disable  || 'false',
            handle: option.handle,
            axis: option.axis || 'horizontal',
            cursor: option.cursor || 'pointer',
            delay: option.delay || 300,
            opacity: option.opacity || 0.5,
            scroll: option.scroll || 'false',
            stack: option.stack || 2
        };

        var options = $.extend({
            zIndex: 2
        },option);

        return this;
    }
})(jQuery);








