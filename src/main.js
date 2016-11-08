//jianqing

;(function($,window,document){

    //定义构造函数
    var Draglist = function(ele,opt){
        this.VERSION = '1.0.0';
        this.$element = ele;
        this.defaults = {
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
        this.options = $.extend({},this.defaults,opt);
    };

    //定义方法
    Draglist.prototype = {
        //function
        destroy: function(){},
        disable: function(){},
        enable: function(){},
        getOption: function(){},
        add: function(){},
        delete: function(){},
        edit: function(){},

        //event
        createObj: function(){},
        drag: function(){},
        start: function(){},
        stop: function(){},
        selected: function(){}
    };

    //插件
    $.fn.Draglist = function(option){

        var draglist = new Draglist(this,option);

        return draglist;
    }
})(jQuery,window,document);








