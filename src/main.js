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
        var defaults = {
            type: '',
            disable: 'false',
            handle:'handle',
            axis: 'horizontal',
            cursor: 'pointer',
            delay: 300,
            opacity: 0.5,
            scroll: 'false',
            stack: 2,
            zIndex: 2
        };
        var settings = $.extend(defaults,option);

        return this;
    }
})(jQuery);








