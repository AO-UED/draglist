;(function(parent, fun) {
    if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
        module.exports = fun();
    } else if (typeof define === 'function' && typeof define.amd === 'object') {
        define(fun);
    } else if (typeof define === 'function' && typeof define.cmd === 'object') {
        define(fun);
    } else {
        parent.draglist = fun();
    }
})(window.pt || window, function(draglist) {

    var dom = document.createElement('div');
        dom.className = 'dndPlaceholder';
    var DndData = {
        placeholder: dom,
        placeholderNode: dom,
        eleDrag: null,
        listNode: null,
        dropEffect: null,
    }

    // 常量
    var DND_CONTAINER = 'pt-flowgrid-container', // 拖拽容器classname
        DND_CONTAINER_INDEX = 'data-container-index', // 拖拽容器编号
        DND_LIST = 'pt-dnd-list', // 拖拽列表层classname
        DND_DRAGGABLE = 'pt-dnd-draggable', // 拖拽层classname
        DND_FIRST_PID = 0; // 拖拽列表层classname

    var cache = {
        count: 0,
        getGrid: function(node) {
            var container = view.searchUp(node, DND_CONTAINER);
            return cache[container.getAttribute(DND_CONTAINER_INDEX)]
        }
    };

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
            this.className = c.replace(new RegExp("(?:^|\\s+)" + name + "(?:\\s+|$)", "g"), " ");
        }
    };


    //排序方式 data.sort(sortBy(***));
    function sortBy(name, minor) {
        return function(o, p) {
            var a, b;
            if (o && p && typeof o === 'object' && typeof p === 'object') {
                a = o[name];
                b = p[name];
                if (a === b) {
                    return typeof minor === 'function' ? minor(o, p) : 0;
                }
                if (typeof a === typeof b) {
                    return a < b ? -1 : 1;
                }
                return typeof a < typeof b ? -1 : 1;
            } else {
                thro("error");
            }
        }
    }

    //选择器
    var $ = function(selector) {
        if (!selector) {
            return [];
        }
        var arrEle = [];
        if (document.querySelectorAll) {
            arrEle = document.querySelectorAll(selector);
        } else {
            var oAll = document.getElementsByTagName("div"),
                lAll = oAll.length;
            if (lAll) {
                var i = 0;
                for (i; i < lAll; i += 1) {
                    if (/^\./.test(selector)) {
                        if (oAll[i].className === selector.replace(".", "")) {
                            arrEle.push(oAll[i]);
                        }
                    } else if (/^#/.test(selector)) {
                        if (oAll[i].id === selector.replace("#", "")) {
                            arrEle.push(oAll[i]);
                        }
                    }
                }
            }
        }
        return arrEle;
    };

    function isMouseInFirstHalf(event, targetNode, relativeToParent) {
        var horizontal = false;
        var mousePointer = horizontal ? (event.offsetX || event.layerX)
                                      : (event.offsetY || event.layerY);
        var targetSize = horizontal ? targetNode.offsetWidth : targetNode.offsetHeight;
        var targetPosition = horizontal ? targetNode.offsetLeft : targetNode.offsetTop;
        targetPosition = relativeToParent ? targetPosition : 0;
        return mousePointer < targetPosition + targetSize / 2;
    }

    function stopDragover(placeholder, element) {
        placeholder.remove();
        element.removeClassName("dndDragover");
        return true;
    }

    function getPlaceholderIndex(listNode, placeholderNode) {
        return Array.prototype.indexOf.call(DndData.listNode.children, DndData.placeholderNode);
    }


    //事件绑定
    var DndItemEvent = {
        eleDraggable: null,
        eleDrag: null,
        dropEffect: null,
        isDragging: null,

        //初始化
        init: function(){
            this.eleDraggable = $("."+DND_DRAGGABLE);

            for (var i = this.eleDraggable.length - 1; i >= 0; i--) {
                this.eleDraggable[i].onselectstart = this.selectstart;
                this.eleDraggable[i].ondragstart = this.dragstart;
                this.eleDraggable[i].ondragend = this.dragend;
                this.eleDraggable[i].onclick = this.click;
            }
        },

        //选择开始
        selectstart: function(){
            return false;
        },

        //拖拽开始
        dragstart: function(event){
            DndData.eleDrag = event.target;

            event = event.originalEvent || event;
            event.dataTransfer.setData("Text", 'dummy');
            event.dataTransfer.effectAllowed = "move";
            event.target.addClassName("dndDragging");
            setTimeout(function(){
                event.target.addClassName("dndDraggingSource");
            }, 0)
            DndData.dropEffect = "none";
            this.isDragging = true;
            event.dataTransfer.setDragImage(DndData.eleDrag, 0, 0);
            event.stopPropagation();
        },

        //拖拽结束
        dragend: function(event){
            event = event.originalEvent || event;
            event.target.removeClassName("dndDragging");
            setTimeout(function() { event.target.removeClassName("dndDraggingSource"); }, 0);
            this.isDragging = false;
            event.stopPropagation();
        },

        //点击事件
        click: function(event){
            event = event.originalEvent || event;
            event.stopPropagation();
        }
    }

    //事件绑定
    var DndListEvent = {
        eleDrags: null,
        listNode: null,
        
        init: function(){
            this.eleDrags = $("."+DND_LIST);

            for (var i = this.eleDrags.length - 1; i >= 0; i--) {
                this.eleDrags[i].ondragover = this.dragover;
                this.eleDrags[i].ondragenter = this.dragenter;
                this.eleDrags[i].ondragleave = this.dragleave;
                this.eleDrags[i].ondrop = this.drop;
            }
        },

        dragover: function(event){
            event = event.originalEvent || event;
            DndData.listNode = event.target;

            if (DndData.placeholder != DndData.listNode) {
              event.target.parentNode.append(DndData.placeholder);
            }

            if (event.target !== DndData.listNode) {
              var listItemNode = event.target;
              while (listItemNode.parentNode !== DndData.listNode && listItemNode.parentNode) {
                listItemNode = listItemNode.parentNode;
              }

                if (listItemNode.parentNode === DndData.listNode && listItemNode !== DndData.placeholderNode) {
                    $(listItemNode).addClass('demo')

                    if (isMouseInFirstHalf(event, listItemNode)) {
                      DndData.listNode.insertBefore(DndData.placeholderNode, listItemNode);
                    } else {
                      DndData.listNode.insertBefore(DndData.placeholderNode, listItemNode.nextSibling);
                    }
                }
            }
            else {
                if (isMouseInFirstHalf(event, DndData.placeholderNode, true)) {
                    // while (DndData.placeholderNode.previousElementSibling
                    //      && (isMouseInFirstHalf(event, DndData.placeholderNode.previousElementSibling, true)
                    //      || DndData.placeholderNode.previousElementSibling.offsetHeight === 0)) {
                    //   DndData.listNode.insertBefore(DndData.placeholderNode, DndData.placeholderNode.previousElementSibling);
                    // }
                } else {
                    // while (DndData.placeholderNode.nextElementSibling &&
                    //      !isMouseInFirstHalf(event, DndData.placeholderNode.nextElementSibling, true)) {
                    //   DndData.listNode.insertBefore(DndData.placeholderNode,
                    //       DndData.placeholderNode.nextElementSibling.nextElementSibling);
                    // }
                }
            }

            event.target.addClassName("dndDragover");
            event.preventDefault();
            event.stopPropagation();
            return false;
        },

        dragenter: function(event){
            event = event.originalEvent || event;
            event.preventDefault();
            return true;
        },

        dragleave: function(event){
            event = event.originalEvent || event;

            event.target.removeClassName("dndDragover");
            setTimeout(function() {
              if (!event.target.hasClassName("dndDragover")) {
                DndData.placeholder.remove();
              }
            }, 100);
        },

        drop: function(event){

            
            event = event.originalEvent || event;
            event.preventDefault();
            var data = event.dataTransfer.getData("Text") || event.dataTransfer.getData("text/plain");
            var transferredObject;
            // try {
            //   transferredObject = JSON.parse(data);
            // } catch(e) {
            //   return stopDragover(DndData.placeholder, event.target);
            // }

            var index = getPlaceholderIndex();
            // if (attr.dndDrop) {
            //   transferredObject = invokeCallback(attr.dndDrop, event, index, transferredObject);
            //   if (!transferredObject) {
            //     return stopDragover(DndData.placeholder, event.target);;
            //   }
            // }

            if (event.dataTransfer.dropEffect === "none") {
              if (event.dataTransfer.effectAllowed === "copy" ||
                  event.dataTransfer.effectAllowed === "move") {
                DndData.dropEffect = event.dataTransfer.effectAllowed;
              } else {
                DndData.dropEffect = event.ctrlKey ? "copy" : "move";
              }
            } else {
              DndData.dropEffect = event.dataTransfer.dropEffect;
            }


            console.log(DndData.eleDrag)
            DndData.placeholder.parentNode.append(DndData.eleDrag)
            // DndData.placeholder.filter(':visible').after(dragging);
            // dragging.trigger('dragend.h5s');


            // Clean up
            stopDragover(DndData.placeholder, event.target);;
            event.stopPropagation();
            return false;
        }
    }

    // 拖拽列表对象
    function DragList(containerId, originalData) {
        this.domId = containerId;
        this.tree = originalData || [];
        this.groups = {};

        this.group();
        this.treeDom = this.getDom(this.groups[DND_FIRST_PID]);
        document.getElementById(containerId).innerHTML = this.treeDom;

        this.init();
    }


    // 拖拽列表对象原型
    DragList.prototype = {
        init: function() {
            DndItemEvent.init();
            DndListEvent.init();
            return this;
        },

        //按pid生成分组
        group: function(){
            for (var i = this.tree.length - 1; i >= 0; i--) {
                if(!this.groups[this.tree[i].parentId]){
                    this.groups[this.tree[i].parentId] = [];
                }

                this.groups[this.tree[i].parentId].push(this.tree[i]);
            }

            for(var i in this.groups){
                this.groups[i].sort(sortBy('order'))
            }
        },

        //生成节点DOM
        getDom: function(item){
            if(!item){ return ''};

            var html = '\n<ul class="pt-dnd-list">\n';
            for (var i = 0; i <item.length; i++) {
                html += '<li class="pt-dnd-draggable" draggable="true" data-id="'+ item[i].id +'">';
                html += '<div class="pt-dnd-container">';
                html += '<div class="pt-dnd-content">'+ item[i].name + '</div>';
                html += '</div>';
                html += this.getDom(this.groups[item[i].id]);
                html += '</li>\n';
            };
            html += '</ul>\n';
            return html;
        }
    }

    // 构建实例
    function instance(domId, originalData) {
        var index = DND_CONTAINER + cache.count++;
        cache[index] = new DragList(domId, originalData);
        return cache[index];
    }

    // 销毁实例
    function destroy(grid) {
        delete cache[grid.opt.container.getAttribute(DND_CONTAINER_INDEX)];
        grid.destroy();
        grid = null;
    }


    draglist = {
        version: "0.0.1",
        instance: instance,
        destroy: destroy
    };

    return draglist;
})