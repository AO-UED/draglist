(function($) {
    var dragging, placeholders = $();
    $.fn.sortable = function(options) {
        var method = String(options);
        options = $.extend({
            connectWith: false
        }, options);
        return this.each(function() {
            // 参数里有enable或disable或destroy
            if (/^enable|disable|destroy$/.test(method)) {
                // 有enable，设置后代元素的draggable属性为true，否则为false
                var items = $(this).children($(this).data('items')).attr('draggable', method == 'enable');
                // 有destroy属性，则是移除相关数据和事件
                if (method == 'destroy') {
                    items.add(this).removeData('connectWith items')
                        .off('dragstart.h5s dragend.h5s selectstart.h5s dragover.h5s dragenter.h5s drop.h5s');
                }
                return;
            }
            // items是后代元素（依据参数的items属性来定）
            var isHandle, index, items = $(this).children(options.items);
            // placeholder是，<ul class="sortable-placeholder"></ul>，或<div class="sortable-placeholder"></div>
            var placeholder = $('<' + (/^ul|ol$/i.test(this.tagName) ? 'li' : 'div') + ' class="sortable-placeholder">');
            // 依据参数的handler属性,来绑定更后代元素的isHandle
            items.find(options.handle).mousedown(function() {
                isHandle = true;
            }).mouseup(function() {
                isHandle = false;
            });
            // 给元素的数据属性items赋值
            $(this).data('items', options.items);
            // placeholders放入placeholder
            placeholders = placeholders.add(placeholder);
            if (options.connectWith) {
                $(options.connectWith).add(this).data('connectWith', options.connectWith);
            }

            // 上面代码是做数据环境准备，下面代码开始绑定事件 


            items.attr('draggable', 'true').on('dragstart.h5s', function(e) {
                if (options.handle && !isHandle) {
                    return false;
                }
                isHandle = false;
                // dataTransfer 是 拖拽元素的数据接口
                var dt = e.originalEvent.dataTransfer;
                // effectAllowed 拖拽效果
                dt.effectAllowed = 'move';
                // 为拖拽元素添加指定数据
                dt.setData('Text', 'dummy');
                // dragging是正在拖拽的元素，index是该元素所在数组的位置
                index = (dragging = $(this)).addClass('sortable-dragging').index();
            }).on('dragend.h5s', function() {
                if (!dragging) {
                    return;
                }
                dragging.removeClass('sortable-dragging').show();
                // 移除 placeholders，但保留事件
                placeholders.detach();
                if (index != dragging.index()) {
                    dragging.parent().trigger('sortupdate', { item: dragging });
                }
                // 释放引用
                dragging = null;
            }).not('a[href], img').on('selectstart.h5s', function() {
                // 当元素选中时，阻止元素背景色边蓝
                this.dragDrop && this.dragDrop();
                return false;
            }).end().add([this, placeholder]).on('dragover.h5s dragenter.h5s drop.h5s', function(e) {
                // 注意dragenter，dragover，drop的this是目标元素

                // 拖拽元素，不是items集合内，不给拖拽
                if (!items.is(dragging) && options.connectWith !== $(dragging).parent().data('connectWith')) {
                    return true;
                }
                if (e.type == 'drop') {
                    e.stopPropagation();
                    // 当拖拽的对象，被放下。则在坑后面填入多拽的对象
                    placeholders.filter(':visible').after(dragging);
                    dragging.trigger('dragend.h5s');
                    return false;
                }
                e.preventDefault();
                e.originalEvent.dataTransfer.dropEffect = 'move';
                if (items.is(this)) {

                    if (options.forcePlaceholderSize) {
                        // 大多数情况下，这一步不会实现
                        placeholder.height(dragging.outerHeight());
                    }
                    // 隐藏被拖动的元素
                    dragging.hide();

                    //对象上移或下移
                    $(this)[placeholder.index() < $(this).index() ? 'after' : 'before'](placeholder);
                    
                    placeholders.not(placeholder).detach();
                    console.log(this);

                } else if (!placeholders.is(this) && !$(this).children(options.items).length) {
                    placeholders.detach();
                    $(this).append(placeholder);
                }
                return false;
            });
        });
    };
})(jQuery);
