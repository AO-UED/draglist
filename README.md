列表拖拽插件（基于jQuery）

CSS：

- dragging：拖拽时添加的class

基本配置

    type: String,          //文件夹/文件
    disable: Boolean,      //如果设置为 true，则禁用该 draggable。
    handle: Element,       //拖拽手柄
    axis: String,          //水平 或者 垂直方向
    cursor: String,        //拖拽时光标设置
    delay: Number,         //鼠标按下后直到拖拽开始为止的时间，以毫秒计。该选项可以防止点击在某个元素上时不必要的拖拽。
    opacity: Number,       //当被拖拽时助手（helper）的不透明度。
    scroll: Boolean,       //如果设置为 true，当拖拽时容器会自动滚动。
    stack: Selector,       //控制匹配选择器（selector）的元素集合的 z-index
    zIndex: Number,        //当被拖拽时，助手（helper）的 Z-index



数据结构：

    {
    	id: Number,		 //当前ID
    	parentId: Number,//父节点ID
    	orderId: Number, //排序ID
    	levelId: Number, //层级ID
    	dom: Elemnet,	 //DOM
        type: String,    //类型
        fold: Number,    //是否折叠(文件夹类型下才用)
    }

方法：

1. destroy()
    完全移除 draggable 功能。这会把元素返回到它的预初始化状态。
2. disable()
    禁用 draggable。
3. enable()
    启用 draggable。
4. option()
    获取一个包含键/值对的对象.
5. widget() == find
    返回一个包含 draggable 元素的 jQuery 对象。
6. add()
    新增
7. del()
    删除
8. edit()
    编辑



事件：

1. create( event, ui ) 
    当 draggable 被创建时触发。
2. drag( event, ui )
    在拖拽期间当鼠标移动时触发。
3. start( event, ui )
    当拖拽开始时触发。
4. stop( event, ui )
    当拖拽停止时触发。
5. selected( event, ui )
    当选中时触发
6. 

调用形式

$( "#draggable" ).draggable();


