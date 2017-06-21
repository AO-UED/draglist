// Using this polyfill for safety.
Element.prototype.hasClassName = function(name) {
    return new RegExp("(?:^|\\s+)" + name + "(?:\\s+|$)").test(this.className);
};

Element.prototype.addClassName = function(name) {
    if (!this.hasClassName(name)) {
        this.className = this.className ? [this.className, name].join(' ') : name;
    }
};

Element.prototype.removeClassName = function(name) {
    if (this.hasClassName(name)) {
        var c = this.className;
        this.className = c.replace(new RegExp("(?:^|\\s+)" + name + "(?:\\s+|$)", "g"), "");
    }
};

var samples = samples || {};


/**
 * id       {String}:   自身ID
 * type     {String}:   类型（folder || file）
 * sort     {Number}:   排序字段
 * layer    {Number}:   具体层级
 * isOpen   {Boole}:    当type为folder时，是否打开
 * parentId {String}:   父级ID
 */
var demoData = [
    {id: 1, type: 'folder', sort: 1, parentId: 0, layer: 0, isOpen: false},
    {id: 5, type: 'folder', sort: 1, parentId: 4, layer: 2, isOpen: false},
    {id: 4, type: 'file', sort: 2, parentId: 1, layer: 1, isOpen: false},
    {id: 2, type: 'file', sort: 2, parentId: 0, layer: 0, isOpen: false},
    {id: 3, type: 'folder', sort: 1, parentId: 1, layer: 1, isOpen: false}
]

/**
 * 数据格式化
 * 按layer字段分类排序
 */
function dataFormat(list){
    var newData = [];

    for(var i=0; i<list.length; i++){
        var layer = list[i].layer;
        var flag = false;
        var index;

        for(var j=0; j<newData.length; j++){
            if(newData[j].layer == layer){
                flag = true;
                index = j;
                break;
            }
        }

        if(!flag){
            newData.push({
                layer: layer,
                list: []
            })
            index = newData.length - 1;
        }

        newData[index].list.push(list[i]) 
    }

    newData.sort(by('layer'))

    //每一级内的sort排序
    for(var k=0; k<newData.length; k++){
        newData[k].list.sort(by('sort'));
    }

    return newData;
}



//by函数接受一个成员名字符串和一个可选的次要比较函数做为参数
//并返回一个可以用来包含该成员的对象数组进行排序的比较函数
//当o[age] 和 p[age] 相等时，次要比较函数被用来决出高下
//demo.sort(by('age',by('name')));
var by = function(name,minor){
    return function(o,p){
        var a,b;
        if(o && p && typeof o === 'object' && typeof p ==='object'){
            a = o[name];
            b = p[name];
            if(a === b){
                return typeof minor === 'function' ? minor(o,p):0;
            }
            if(typeof a === typeof b){
                return a <b ? -1:1;
            }
            return typeof a < typeof b ? -1 : 1;
        }else{
            thro("error");
        }
    }
}


;(function (parent, fun) {
    if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
        module.exports = fun();
    } else if (typeof define === 'function' && typeof define.amd === 'object') {
        define(fun);
    } else if (typeof define === 'function' && typeof define.cmd === 'object') {
        define(fun);
    } else {
        parent.dragdrop = fun();
    }
})(window.pt || window, function (dragdrop){

    // 常量
    var THROTTLE_TIME = 10,                                // 节流函数的间隔时间单位ms, FPS = 1000 / THROTTLE_TIME
        MEDIA_QUERY_SMALL = 768,                           // 分辨率768px
        MEDIA_QUERY_MID = 992,                             // 分辨率992px
        MEDIA_QUERY_BIG = 1200,                            // 分辨率1200px
        DND_CONTAINER = 'pt-flowgrid-container',          // 拖拽容器classname
        DND_CONTAINER_INDEX = 'data-container-index',     // 拖拽容器编号
        DND_ITEM = 'pt-draggable'                           // 拖拽块classname

    // 默认设置
    var setting = {
        items: null,
        originalData: []
    };

    // 网格对象的缓存对象
    var f = function () {};
    var cache = {
        count: 0,
        getGrid: function (node) {
            var container = view.searchUp(node, DND_CONTAINER);
            return cache[container.getAttribute(DND_CONTAINER_INDEX)]
        }
    };

    //事件处理对象
    var dragEvent = {
        init: function (isbind, containerId) {
            if (this.isbind) return;
            this.isbind = isbind;
            setting.items = document.querySelectorAll('#' + containerId + ' .' + DND_ITEM);
            this.unbindEvent(setting.items);
            this.bindEvent(setting.items);
        },

        // 绑定监听
        bindEvent: function (items) {
            [].forEach.call(items, function(item) {
                item.setAttribute('draggable', 'true');
                item.addEventListener('dragstart', dragEvent.handleDragStart, false);
                item.addEventListener('dragenter', dragEvent.handleDragEnter, false);
                item.addEventListener('dragover', dragEvent.handleDragOver, false);
                item.addEventListener('dragleave', dragEvent.handleDragLeave, false);
                item.addEventListener('drop', dragEvent.handleDrop, false);
                item.addEventListener('dragend', dragEvent.handleDragEnd, false);

                setting.originalData.push({
                    id: item.getAttribute('data-dnd-id'), 
                    type: item.getAttribute('data-dnd-type'),
                    sort: item.getAttribute('data-dnd-sort'), 
                    parentId: item.getAttribute('data-dnd-parentId'), 
                    layer: item.getAttribute('data-dnd-layer'), 
                    isOpen: item.getAttribute('data-dnd-isOpen')
                })
            });

            console.log(setting.originalData)
        },

        unbindEvent: function(items){
            [].forEach.call(items, function(item) {
                item.removeEventListener('dragstart', dragEvent.handleDragStart, false);
                item.removeEventListener('dragenter', dragEvent.handleDragEnter, false);
                item.removeEventListener('dragover', dragEvent.handleDragOver, false);
                item.removeEventListener('dragleave', dragEvent.handleDragLeave, false);
                item.removeEventListener('drop', dragEvent.handleDrop, false);
                item.removeEventListener('dragend', dragEvent.handleDragEnd, false);
            });
        },

        handleDragStart: function(e) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', this.innerHTML);

            dragSrcEl_ = this;

            // this/e.target is the source node.
            this.addClassName('moving');
        },

        handleDragOver: function(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.dataTransfer.dropEffect = 'move';
            return false;
        },

        handleDragEnter: function(e) {
            this.addClassName('over');
        },

        handleDragLeave: function(e) {
            this.removeClassName('over');
        },

        handleDragEnd: function(e) {
            [].forEach.call(setting.items, function(col) {
                col.removeClassName('over');
            });

            // target element (this) is the source node.
            this.style.opacity = '1';
        },

        handleDrop: function(e) {
            // this/e.target is current target element.

            if (e.stopPropagation) {
                e.stopPropagation(); // stops the browser from redirecting.
            }

            // Don't do anything if we're dropping on the same column we're dragging.
            if (dragSrcEl_ != this) {
                dragSrcEl_.innerHTML = this.innerHTML;
                this.innerHTML = e.dataTransfer.getData('text/html');
            }

            return false;
        }
    }

    function DragList(containerId, originalData){
        this.init(containerId, originalData);
    }

    DragList.prototype = {
        init: function (containerId, originalData) {
            // dragEvent.init(true, containerId);
            return this;
        }
    }

    // 构建实例
    function instance(containerId, originalData){
        //绑定事件
        dragEvent.init(true, containerId);

        var container = document.getElementById(containerId);
        var index = DND_CONTAINER + cache.count++;
        if (!container.getAttribute(DND_CONTAINER_INDEX))
            container.setAttribute(DND_CONTAINER_INDEX, index);
        cache[index] = new DragList(containerId, originalData);
        return cache[index];
    }

    /**
     * 字段排序
     */
    function sortBy (name, minor){
        return function(o,p){
            var a,b;
            if(o && p && typeof o === 'object' && typeof p ==='object'){
                a = o[name];
                b = p[name];
                if(a === b){
                    return typeof minor === 'function' ? minor(o,p):0;
                }
                if(typeof a === typeof b){
                    return a <b ? -1:1;
                }
                return typeof a < typeof b ? -1 : 1;
            }else{
                thro("error");
            }
        }
    }

    /**
     * 数据格式化
     * 按layer字段分类排序
     */
    function dataFormat(list){
        var newData = [];

        for(var i=0; i<list.length; i++){
            var layer = list[i].layer;
            var flag = false;
            var index;

            for(var j=0; j<newData.length; j++){
                if(newData[j].layer == layer){
                    flag = true;
                    index = j;
                    break;
                }
            }

            if(!flag){
                newData.push({
                    layer: layer,
                    list: []
                })
                index = newData.length - 1;
            }

            newData[index].list.push(list[i]) 
        }

        newData.sort(by('layer'))

        //每一级内的sort排序
        for(var k=0; k<newData.length; k++){
            newData[k].list.sort(by('sort'));
        }

        return newData;
    }

    // 销毁实例
    function destroy(grid) {
        delete cache[grid.opt.container.getAttribute(DND_CONTAINER_INDEX)];
        grid.destroy();
        grid = null;
    }


    dragdrop = {
        version: "0.0.1",
        instance: instance,
        destroy: destroy
    };

    return dragdrop;
})




/*
(function() {
    var id_ = 'columns-dragEnd';
    var cols_ = document.querySelectorAll('#' + id_ + ' .column');
    var dragSrcEl_ = null;


    this.handleDragStart = function(e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);

        dragSrcEl_ = this;

        this.style.opacity = '0.4';

        // this/e.target is the source node.
        this.addClassName('moving');
    };

    this.handleDragOver = function(e) {
        if (e.preventDefault) {
            e.preventDefault(); // Allows us to drop.
        }

        e.dataTransfer.dropEffect = 'move';

        return false;
    };

    this.handleDragEnter = function(e) {
        this.addClassName('over');
    };

    this.handleDragLeave = function(e) {
        // this/e.target is previous target element.
        this.removeClassName('over');
    };

    this.handleDragEnd = function(e) {
        [].forEach.call(cols_, function(col) {
            col.removeClassName('over');
        });

        // target element (this) is the source node.
        this.style.opacity = '1';
    };

    this.handleDrop = function(e) {
        // this/e.target is current target element.

        if (e.stopPropagation) {
            e.stopPropagation(); // stops the browser from redirecting.
        }

        // Don't do anything if we're dropping on the same column we're dragging.
        if (dragSrcEl_ != this) {
            dragSrcEl_.innerHTML = this.innerHTML;
            this.innerHTML = e.dataTransfer.getData('text/html');
        }

        return false;
    };

    [].forEach.call(cols_, function(col) {
        // Enable columns to be draggable.
        col.setAttribute('draggable', 'true'); // Enable columns to be draggable.
        col.addEventListener('dragstart', this.handleDragStart, false);
        col.addEventListener('dragenter', this.handleDragEnter, false);
        col.addEventListener('dragover', this.handleDragOver, false);
        col.addEventListener('dragleave', this.handleDragLeave, false);
        col.addEventListener('drop', this.handleDrop, false);
        col.addEventListener('dragend', this.handleDragEnd, false);
    });
})();

*/
