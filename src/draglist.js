/*
    DataTransfer 对象：退拽对象用来传递的媒介，使用一般为Event.dataTransfer。
    draggable 属性：就是标签元素要设置draggable=true，否则不会有效果，例如：
        <div title="拖拽我" draggable="true">列表1</div>
    ondragstart 事件：当拖拽元素开始被拖拽的时候触发的事件，此事件作用在被拖曳元素上
    ondragenter 事件：当拖曳元素进入目标元素的时候触发的事件，此事件作用在目标元素上
    ondragover 事件：拖拽元素在目标元素上移动的时候触发的事件，此事件作用在目标元素上
    ondrop 事件：被拖拽的元素在目标元素上同时鼠标放开触发的事件，此事件作用在目标元素上
    ondragend 事件：当拖拽完成后触发的事件，此事件作用在被拖曳元素上
    Event.preventDefault() 方法：阻止默认的些事件方法等执行。在ondragover中一定要执行preventDefault()，否则ondrop事件不会被触发。另外，如果是从其他应用软件或是文件中拖东西进来，尤其是图片的时候，默认的动作是显示这个图片或是相关信息，并不是真的执行drop。此时需要用用document的ondragover事件把它直接干掉。
    Event.effectAllowed 属性：就是拖拽的效果。
*/

;
(function(parent, fun) {
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

    // 常量
    var THROTTLE_TIME = 10, // 节流函数的间隔时间单位ms, FPS = 1000 / THROTTLE_TIME
        MEDIA_QUERY_SMALL = 768, // 分辨率768px
        MEDIA_QUERY_MID = 992, // 分辨率992px
        MEDIA_QUERY_BIG = 1200, // 分辨率1200px
        DND_CONTAINER = 'pt-flowgrid-container', // 拖拽容器classname
        DND_CONTAINER_INDEX = 'data-container-index', // 拖拽容器编号
        DND_LIST = 'pt-dnd-list', // 拖拽列表层classname
        DND_ITEM = 'pt-dnd-draggable' // 拖拽块classname

    // 默认设置
    var setting = {
        items: null,
        originalData: [],
        listSrcElement: null,   //list 对象
        itemSrcElement: null,   //item 对象
    };

    // 网格对象的缓存对象
    var f = function() {};
    var cache = {
        count: 0,
        getGrid: function(node) {
            var container = view.searchUp(node, DND_CONTAINER);
            return cache[container.getAttribute(DND_CONTAINER_INDEX)]
        }
    };


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


    //事件处理对象
    var dragEvent = {
        init: function(isbind, containerId) {
            if (this.isbind) return;
            this.isbind = isbind;
            setting.items = document.querySelectorAll('#' + containerId + ' .' + DND_ITEM);
            this.unbindEvent(setting.items);
            this.bindEvent(setting.items);
        },

        // 绑定监听
        bindEvent: function(items) {
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

        unbindEvent: function(items) {
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

    function dndDropEffectWorkaround() {
        return {};
    }

    function dndDragTypeWorkaround() {
        return {};
    }

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

    //列表层的事件
    var dndListEvent = {

        placeholder: null,
        placeholderNode: null,
        listNode: null,
        listNodeData: {},

        init: function(lists) {
            // if (this.isbind) return;
            // this.isbind = isbind;
            lists && this.unbindEvent(lists);
            this.bindEvent(lists);
        },

        // 绑定监听
        bindEvent: function(lists) {
            var $this = this;

            [].forEach.call(lists, function(list) {
                list.setAttribute('draggable', 'true');
                list.addEventListener('dragenter', $this.dndListDragEnter, false);
                list.addEventListener('dragover', $this.dndListDragOver, false);
                list.addEventListener('drop', $this.dndListDrop, false);
                list.addEventListener('dragleave', $this.dndListDragLeave, false);

                var _listNode = {
                    placeholder: $this.getPlaceholderElement(list),
                    placeholderNode: $this.getPlaceholderElement(list),
                    listNode: list
                }

                $this.listNodeData[list.getAttribute("dnd-id")] = _listNode;
            });
        },

        // 移除监听
        unbindEvent: function(lists) {
            var $this = this;

            [].forEach.call(lists, function(list) {
                list.removeEventListener('dragenter', $this.dndListDragEnter, false);
                list.removeEventListener('dragover', $this.dndListDragOver, false);
                list.removeEventListener('drop', $this.dndListDrop, false);
                list.removeEventListener('dragleave', $this.dndListDragLeave, false);
            });
        },

        //
        dndListDragEnter: function(event) {
            event = event.originalEvent || event;

            //更新选中层
            dndListEvent.dndListNodeUpdate(this);

            // if (!this.isDropAllowed(event)) return true;

            event.preventDefault();
        },

        //更新数据
        dndListNodeUpdate: function(element){
            this.placeholder = this.getPlaceholderElement(element);
            this.placeholderNode = this.placeholder[0];
            this.listNode = element[0];
            this.placeholder.remove();
        },

        getListNode: function(id){
            for (var i = this.listNodeData.length - 1; i >= 0; i--) {
                this.listNodeData[i].listNode == element;
            }
        },

        //
        dndListDragOver: function(event) {
            event = event.originalEvent || event;
            var lisstNodeData = dndListEvent.listNodeData[this.getAttribute("dnd-id")];

            // if (!this.isDropAllowed(event)) return true;

            // First of all, make sure that the placeholder is shown
            // This is especially important if the list is empty
            if (lisstNodeData.placeholderNode.parentNode != lisstNodeData.listNode) {
                this.append(lisstNodeData.placeholder);
            }

            if (event.target !== lisstNodeData.listNode) {
                // Try to find the node direct directly below the list node.
                var listItemNode = event.target;
                while (listItemNode.parentNode !== lisstNodeData.listNode && listItemNode.parentNode) {
                    listItemNode = listItemNode.parentNode;
                }

                if (listItemNode.parentNode === lisstNodeData.listNode && listItemNode !== lisstNodeData.placeholderNode) {
                    // If the mouse pointer is in the upper half of the child element,
                    // we place it before the child element, otherwise below it.
                    if (dndListEvent.isMouseInFirstHalf(event, listItemNode)) {
                        lisstNodeData.listNode.insertBefore(lisstNodeData.placeholderNode, listItemNode);
                    } else {
                        lisstNodeData.listNode.insertBefore(lisstNodeData.placeholderNode, listItemNode.nextSibling);
                    }
                }
            } else {
                // This branch is reached when we are dragging directly over the list element.
                // Usually we wouldn't need to do anything here, but the IE does not fire it's
                // events for the child element, only for the list directly. Therefore, we repeat
                // the positioning algorithm for IE here.
                if (dndListEvent.isMouseInFirstHalf(event, lisstNodeData.placeholderNode, true)) {
                    // Check if we should move the placeholder element one spot towards the top.
                    // Note that display none elements will have offsetTop and offsetHeight set to
                    // zero, therefore we need a special check for them.
                    while (lisstNodeData.placeholderNode.previousElementSibling && (dndListEvent.isMouseInFirstHalf(event, lisstNodeData.placeholderNode.previousElementSibling, true) || lisstNodeData.placeholderNode.previousElementSibling.offsetHeight === 0)) {
                        lisstNodeData.listNode.insertBefore(lisstNodeData.placeholderNode, lisstNodeData.placeholderNode.previousElementSibling);
                    }
                } else {
                    // Check if we should move the placeholder element one spot towards the bottom
                    while (lisstNodeData.placeholderNode.nextElementSibling &&
                        !dndListEvent.isMouseInFirstHalf(event, lisstNodeData.placeholderNode.nextElementSibling, true)) {
                        lisstNodeData.listNode.insertBefore(lisstNodeData.placeholderNode,
                            lisstNodeData.placeholderNode.nextElementSibling.nextElementSibling);
                    }
                }
            }

            // At this point we invoke the callback, which still can disallow the drop.
            // We can't do this earlier because we want to pass the index of the placeholder.
            if (this.getAttribute("dnd-dragover") && !invokeCallback(this.getAttribute("dnd-dragover"), event, getPlaceholderIndex())) {
                return stopDragover();
            }

            this.addClassName("dndDragover");
            event.preventDefault();
            event.stopPropagation();
            return false;
        },

        //
        dndListDrop: function(event) {
            event = event.originalEvent || event;
            var lisstNodeData = dndListEvent.listNodeData[this.getAttribute("dnd-id")];

            // if (!dndListEvent.isDropAllowed(event)) return true;

            // The default behavior in Firefox is to interpret the dropped element as URL and
            // forward to it. We want to prevent that even if our drop is aborted.
            event.preventDefault();

            // Unserialize the data that was serialized in dragstart. According to the HTML5 specs,
            // the "Text" drag type will be converted to text/plain, but IE does not do that.
            var data = event.dataTransfer.getData("text/html") || event.dataTransfer.getData("text/plain");
            var transferredObject;
            // try {
            //     transferredObject = JSON.parse(data);
            // } catch (e) {
            //     return dndListEvent.stopDragover(lisstNodeData.placeholder, this);
            // }

            // Invoke the callback, which can transform the transferredObject and even abort the drop.
            var index = dndListEvent.getPlaceholderIndex(lisstNodeData.listNode, lisstNodeData.placeholder);
            // if (attr.dndDrop) {
            //     transferredObject = invokeCallback(attr.dndDrop, event, index, transferredObject);
            //     if (!transferredObject) {
            //         return dndListEvent.stopDragover(lisstNodeData.placeholder, this);
            //     }
            // }

            // Insert the object into the array, unless dnd-drop took care of that (returned true).
            // if (transferredObject !== true) {
            //     scope.$apply(function() {
            //         scope.$eval(attr.dndList).splice(index, 0, transferredObject);
            //     });
            // }
            // invokeCallback(attr.dndInserted, event, index, transferredObject);

            // In Chrome on Windows the dropEffect will always be none...
            // We have to determine the actual effect manually from the allowed effects
            // if (event.dataTransfer.dropEffect === "none") {
            //     if (event.dataTransfer.effectAllowed === "copy" ||
            //         event.dataTransfer.effectAllowed === "move") {
            //         dndDropEffectWorkaround.dropEffect = event.dataTransfer.effectAllowed;
            //     } else {
            //         dndDropEffectWorkaround.dropEffect = event.ctrlKey ? "copy" : "move";
            //     }
            // } else {
            //     dndDropEffectWorkaround.dropEffect = event.dataTransfer.dropEffect;
            // }

            this.after(jQuery(data)[2]);

            // Clean up
            dndListEvent.stopDragover(lisstNodeData.placeholder, this);
            event.stopPropagation();
            return false;
        },

        //
        dndListDragLeave: function(event) {
            event = event.originalEvent || event;
            var lisstNodeData = dndListEvent.listNodeData[this.getAttribute("dnd-id")];

            this.removeClassName("dndDragover");
            var $this = this;
            // var placeholderRemove = setInterval(function(){
                if (!$this.hasClassName("dndDragover")) {
                    lisstNodeData.placeholder.remove();
                }
            // }, 100)
            // $timeout(function() {
                // if (!this.hasClassName("dndDragover")) {
                //     lisstNodeData.placeholder.remove();
                // }
            // }, 100);
        },

        //
        isMouseInFirstHalf: function(event, targetNode, relativeToParent) {
            var horizontal = false;
            var mousePointer = horizontal ? (event.offsetX || event.layerX) : (event.offsetY || event.layerY);
            var targetSize = horizontal ? targetNode.offsetWidth : targetNode.offsetHeight;
            var targetPosition = horizontal ? targetNode.offsetLeft : targetNode.offsetTop;
            targetPosition = relativeToParent ? targetPosition : 0;
            return mousePointer < targetPosition + targetSize / 2;
        },

        //尝试查找具有dnd Placeholder类集的子元素。 如果没有找到，则创建一个new li元素。
        getPlaceholderElement: function(element) {
            var placeholder;
            var children = element.children;
            var childrenLength = children.length;

            for (var i = childrenLength - 1; i >= 0; i--) {
                if (children[i].hasClassName('dndPlaceholder')) {
                    placeholder = children[i];
                    break;
                }
            }

            // angular.forEach(element.children(), function(childNode) {
            //     var child = angular.element(childNode);
            //     if (child.hasClass('dndPlaceholder')) {
            //         placeholder = child;
            //     }
            // });

            var li = document.createElement("li");
            li.setAttribute("class", "dndPlaceholder");

            return placeholder || li;
        },

        //
        getPlaceholderIndex: function(listNode, placeholderNode) {
            return Array.prototype.indexOf.call(listNode.children, placeholderNode);
        },

        //检查允许放下所必须满足的各种条件
        isDropAllowed: function(event) {

            // 不允许从外部源丢弃，除非明确允许。
            // if (!dndDragTypeWorkaround().isDragging && !externalSources) return false;

            // 检查mimetype。 通常我们会使用自定义拖动类型而不是文本，但IE不支持。
            if (!dndListEvent.hasTextMimetype(event.dataTransfer.types)) return false;

            // 现在根据传入元素的类型检查dnd-allowed-types。 对于放下层外部源我们不知道类型，所以它需要通过dnd-drop检查。
            if (attr.dndAllowedTypes && dndDragTypeWorkaround().isDragging) {
                var allowed = scope.$eval(attr.dndAllowedTypes);
                if (angular.isArray(allowed) && allowed.indexOf(dndDragTypeWorkaround().dragType) === -1) {
                    return false;
                }
            }

            // 检查是否完全禁用dnd
            if (attr.dndDisableIf && scope.$eval(attr.dndDisableIf)) return false;

            return true;
        },

        //
        stopDragover: function(placeholder, element) {
            placeholder.remove();
            element.removeClassName("dndDragover");
            return true;
        },

        //
        invokeCallback: function(expression, event, index, item) {
            return $parse(expression)(scope, {
                event: event,
                index: index,
                item: item || undefined,
                external: !dndDragTypeWorkaround().isDragging,
                type: dndDragTypeWorkaround().isDragging ? dndDragTypeWorkaround().dragType : undefined
            });
        },

        //
        hasTextMimetype: function(types) {
            if (!types) return true;
            for (var i = 0; i < types.length; i++) {
                if (types[i] === "Text" || types[i] === "text/plain") return true;
            }

            return false;
        }
    }

    //拖拽层的事件
    var dndItemEvent = {
        //拖动的dom
        currentDragSrcEl_: null,

        init: function(items) {
            // if (this.isbind) return;
            // this.isbind = isbind;
            items && this.unbindEvent(items);
            this.bindEvent(items);
        },

        // 绑定监听
        bindEvent: function(items) {
            var $this = this;

            [].forEach.call(items, function(item) {
                item.setAttribute('draggable', 'true');
                item.addEventListener('dragstart', $this.dndItemDragStart, false);
                item.addEventListener('dragend', $this.dndItemDragEnd, false);
                item.addEventListener('click', $this.dndItemClick, false);
                item.addEventListener('selectstart', $this.dndItemSelectstart, false);
            });
        },

        // 移除监听
        unbindEvent: function(items) {
            var $this = this;

            [].forEach.call(items, function(item) {
                item.removeEventListener('dragstart', $this.dndItemDragStart, false);
                item.removeEventListener('dragend', $this.dndItemDragEnd, false);
                item.removeEventListener('click', $this.dndItemClick, false);
                item.removeEventListener('selectstart', $this.dndItemSelectstart, false);
            });
        },

        //
        dndItemDragStart: function(event) {
            dndItemEvent.currentDragSrcEl_ = this;

            event = event.originalEvent || event;

            // Check whether the element is draggable, since dragstart might be triggered on a child.
            if (dndItemEvent.currentDragSrcEl_.getAttribute('draggable') == 'false') return true;

            // Serialize the data associated with this element. IE only supports the Text drag type
            // event.dataTransfer.setData("Text", angular.toJson(scope.$eval(attr.dndDraggable)));
            event.dataTransfer.setData('text/html', this.innerHTML);

            // Only allow actions specified in dnd-effect-allowed attribute
            // event.dataTransfer.effectAllowed = attr.dndEffectAllowed || "move";
            event.dataTransfer.effectAllowed = "move";

            // Add CSS classes. See documentation above
            dndItemEvent.currentDragSrcEl_.addClassName("dndDragging");
            setTimeout(function(){
                dndItemEvent.currentDragSrcEl_.addClassName("dndDraggingSource");
            }, 0)

            // Workarounds for stupid browsers, see description below
            dndDropEffectWorkaround().dropEffect = "none";
            dndDragTypeWorkaround().isDragging = true;

            // Save type of item in global state. Usually, this would go into the dataTransfer
            // typename, but we have to use "Text" there to support IE
            // dndDragTypeWorkaround().dragType = attr.dndType ? scope.$eval(attr.dndType) : undefined;
            dndDragTypeWorkaround().dragType = undefined;

            // Try setting a proper drag image if triggered on a dnd-handle (won't work in IE).
            // if (event._dndHandle && event.dataTransfer.setDragImage) {
                event.dataTransfer.setDragImage(dndItemEvent.currentDragSrcEl_, 0, 0);
            // }

            // Invoke callback
            // $parse(attr.dndDragstart)(scope, {event: event});

            event.stopPropagation();
        },

        //
        dndItemDragEnd: function(event) {
            event = event.originalEvent || event;

            var dropEffect = dndDropEffectWorkaround().dropEffect;
            // scope.$apply(function() {
            //     switch (dropEffect) {
            //         case "move":
            //             $parse(attr.dndMoved)(scope, { event: event });
            //             break;
            //         case "copy":
            //             $parse(attr.dndCopied)(scope, { event: event });
            //             break;
            //         case "none":
            //             $parse(attr.dndCanceled)(scope, { event: event });
            //             break;
            //     }
            //     $parse(attr.dndDragend)(scope, { event: event, dropEffect: dropEffect });
            // });

            // Clean up
            dndItemEvent.currentDragSrcEl_.removeClassName("dndDragging");
            // $timeout(function() { 
            dndItemEvent.currentDragSrcEl_.removeClassName("dndDraggingSource");
            // }, 0);
            dndDragTypeWorkaround.isDragging = false;
            event.stopPropagation();
        },

        //
        dndItemClick: function(event) {
            // if (!attr.dndSelected) return;

            event = event.originalEvent || event;
            // scope.$apply(function() {
            //     $parse(attr.dndSelected)(scope, { event: event });
            // });

            // Prevent triggering dndSelected in parent elements.
            event.stopPropagation();
        },

        //
        dndItemSelectstart: function() {
            if (this.dragDrop) this.dragDrop();
        }
    }

    // 拖拽列表对象
    function DragList(containerId, originalData) {
        this.init(containerId, originalData);
    }

    //更新拖拽层对象
    function srcElementUpdate(type, element){
        setting[type] = element;
    }

    // 拖拽列表对象原型
    DragList.prototype = {
        init: function(container, originalData) {
            this.dndLists = container.querySelectorAll('.' + DND_LIST);
            this.dndItems = container.querySelectorAll('.' + DND_ITEM);

            //
            dndListEvent.init(this.dndLists);
            dndItemEvent.init(this.dndItems);

            return this;
        }
    }

    // 构建实例
    function instance(container, originalData) {
        var index = DND_CONTAINER + cache.count++;
        if (!container.getAttribute(DND_CONTAINER_INDEX))
            container.setAttribute(DND_CONTAINER_INDEX, index);
        cache[index] = new DragList(container, originalData);
        return cache[index];
    }

    /**
     * 字段排序
     */
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

    /**
     * 数据格式化
     * 按layer字段分类排序
     */
    function dataFormat(list) {
        var newData = [];

        for (var i = 0; i < list.length; i++) {
            var layer = list[i].layer;
            var flag = false;
            var index;

            for (var j = 0; j < newData.length; j++) {
                if (newData[j].layer == layer) {
                    flag = true;
                    index = j;
                    break;
                }
            }

            if (!flag) {
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
        for (var k = 0; k < newData.length; k++) {
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


    draglist = {
        version: "0.0.1",
        instance: instance,
        destroy: destroy
    };

    return draglist;
})
