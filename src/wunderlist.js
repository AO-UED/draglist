define("helpers/dnd/BaseDragAndDropHandler", ["project!core"], function(e) {
    var t = e.BaseEventEmitter.extend({
        setDOMEvents: function(e) {
            var t = this;
            t.domListeners = e;
        },
        enable: function() {
            var e = this;
            Object.keys(e.domListeners).forEach(function(t) {
                var i = e.domListeners[t];
                e.el.addEventListener(t, i, !1);
            });
        },
        disable: function() {
            var e = this;
            Object.keys(e.domListeners).forEach(function(t) {
                var i = e.domListeners[t];
                e.el.removeEventListener(t, i, !1);
            });
        },
        onDestroy: function() {
            var e = this;
            e.disable();
        }
    });
    return t;
}),
define("helpers/dnd/workaroundstate", [], function() {
    var e = null
      , t = "none";
    return {
        clearWorkaround: function() {
            e = null ,
            t = "none";
        },
        hasWorkaroundSet: function() {
            return !!e;
        },
        setWorkaroundMimeType: function(t) {
            e = t;
        },
        getWorkaroundMimeType: function() {
            return e;
        },
        setWorkaroundDropEffect: function(e) {
            t = e;
        },
        getWorkaroundDropEffect: function() {
            return t;
        }
    };
}),
define("helpers/dnd/eventUtil", ["./workaroundstate", "../domtools"], function(e, t) {
    function i(e, t) {
        var i, n = e.dataTransfer, o = "";
        try {
            o = n.effectAllowed.toLowerCase();
        } catch (a) {
            console.warn(a);
        }
        if ("all" === o)
            return t[0];
        for (i = 0; i < t.length; ++i)
            if (-1 !== o.indexOf(t[i]))
                return t[i];
        return null ;
    }
    function n(t, i) {
        e.hasWorkaroundSet() ? e.setWorkaroundDropEffect(i) : t.dataTransfer.dropEffect = i;
    }
    function o(e, t) {
        var i, n, o = t.length;
        for (i = 0; o > i; ++i)
            for (n = 0; n < e.length; ++n)
                if (t[i] === e[n])
                    return t[i];
    }
    function a(e) {
        e.preventDefault();
    }
    function r(e) {
        e.preventDefault();
    }
    function s(t) {
        return e.hasWorkaroundSet() ? [e.getWorkaroundMimeType()] : Array.prototype.slice.call(t.dataTransfer.types);
    }
    function l(t, i) {
        return e.hasWorkaroundSet() ? i === e.getWorkaroundMimeType() ? t.dataTransfer.getData("Text") : "" : t.dataTransfer.getData(i);
    }
    function c(e, i) {
        return t.getDirectChildOf(e, i);
    }
    return {
        findMatchingDropEffect: i,
        findMatchingMimetype: o,
        setDropEffect: n,
        allowDrop: a,
        acceptDrop: r,
        getDragMimetypes: s,
        getDragData: l,
        getItemFromTarget: c
    };
}),
define("helpers/dnd/DragList", ["./BaseDragAndDropHandler", "./workaroundstate", "../domtools", "./eventUtil"], function(e, t, i, n) {
    var o = e.extend({
        initialize: function(e, t) {
            var i = this;
            if (i.el = e,
            i.getDragImage = t.getDragImage ? t.getDragImage : !1,
            "function" != typeof t.itemToData)
                throw new Error("missing itemToData option");
            if (i.itemToData = t.itemToData,
            i.disposeDragImage = t.disposeDragImage,
            "string" != typeof t.mimeType && "function" != typeof t.mimeType)
                throw new Error("missing mimeType option");
            i.effectAllowed = i._effectAllowed(t.effectAllowed || ["move"]),
            i.options = t,
            i.currentDragImage = null ,
            i.setDOMEvents({
                dragstart: i._onDragStart.bind(i),
                dragover: i._stopPropagation.bind(i),
                drop: i._stopPropagation.bind(i)
            });
        },
        prepareItem: function(e) {
            e.setAttribute("draggable", "true");
        },
        _effectAllowed: function(e) {
            var t = -1 !== e.indexOf("copy")
              , i = -1 !== e.indexOf("link")
              , n = -1 !== e.indexOf("move");
            return t && n && !i ? "copyMove" : !t && n && i ? "linkMove" : t && !n && i ? "copyLink" : !t || n || i ? t || n || !i ? t || !n || i ? t && n && i ? "all" : "none" : "move" : "link" : "copy";
        },
        _onDragStart: function(e) {
            var a = this
              , r = n.getItemFromTarget(a.el, e.target);
            if (r) {
                var s, l = e.dataTransfer;
                a.trigger("drag", r),
                s = a.itemToData(r),
                l.setDragImage && a.getDragImage && (a.currentDragImage = a.getDragImage(r, s),
                l.setDragImage(a.currentDragImage, 0, 0)),
                l.effectAllowed = a.effectAllowed;
                var c;
                "string" == typeof a.options.mimeType ? c = a.options.mimeType : "function" == typeof a.options.mimeType && (c = a.options.mimeType(r));
                try {
                    l.setData(c, s);
                } catch (d) {
                    t.setWorkaroundMimeType(c),
                    l.setData("Text", s);
                }
                o.setSourceNode(e.target),
                i.once(e.target, "dragend", a._onDragEnd.bind(a)),
                e.stopPropagation();
            }
        },
        _onDragEnd: function() {
            var e = this;
            o.setSourceNode(null ),
            t.clearWorkaround(),
            e.disposeDragImage && e.disposeDragImage(e.currentDragImage),
            e.currentDragImage = null ;
        },
        _stopPropagation: function(e) {
            e.stopPropagation();
        }
    });
    return o.setSourceNode = function(e) {
        var t = this;
        t.sourceNode = e;
    }
    ,
    o.getSourceNode = function() {
        var e = this;
        return e.sourceNode;
    }
    ,
    o;
}),
define("helpers/dnd/DropZone", ["./BaseDragAndDropHandler", "./eventUtil"], function(e, t) {
    var i = "no-pointer-events-for-children"
      , n = e.prototype;
    return e.extend({
        initialize: function(e, t) {
            var i = this;
            n.initialize.call(i),
            i.el = e,
            i.noPointerEventsStyleElement = null ,
            i.dropEffects = [t.dropEffect],
            i.hoverClass = t.hoverClass,
            i.mimeTypes = t.mimeTypes,
            i.setDOMEvents({
                dragenter: i._onDragEnter.bind(i),
                dragover: i._onDragOver.bind(i),
                dragleave: i._onDragLeave.bind(i),
                drop: i._onDrop.bind(i)
            });
        },
        _onDragEnter: function(e) {
            var i = this;
            i._disablePointerEventsForChildren(),
            i._isDropAllowed(e) && (t.allowDrop(e),
            i._setDropEffectIfNeeded(e));
        },
        _onDragLeave: function() {
            var e = this;
            e._enablePointerEventsForChildren(),
            e.hoverClass && e.el.classList.remove(e.hoverClass),
            e.trigger("dragleave");
        },
        _onDragOver: function(e) {
            var i = this;
            i._isDropAllowed(e) && (t.allowDrop(e),
            i.hoverClass && i.el.classList.add(i.hoverClass),
            i.trigger("dragenter", e.clientY),
            i._setDropEffectIfNeeded(e));
        },
        _onDrop: function(e) {
            var i, n, o = this;
            o._enablePointerEventsForChildren(),
            o.hoverClass && o.el.classList.remove(o.hoverClass),
            o.trigger("dragleave"),
            o._isDropAllowed(e) && (t.acceptDrop(e),
            n = o._findMatchingMimetype(e),
            i = t.getDragData(e, n),
            o.trigger("drop", i, n));
        },
        _findMatchingMimetype: function(e) {
            var i = this
              , n = t.getDragMimetypes(e);
            return t.findMatchingMimetype(n, i.mimeTypes);
        },
        _isDropAllowed: function(e) {
            var i = this
              , n = i._findMatchingMimetype(e)
              , o = t.findMatchingDropEffect(e, i.dropEffects);
            return n && o;
        },
        _disablePointerEventsForChildren: function() {
            var e = this;
            if (!e.noPointerEventsClassName) {
                var t = "." + i + " * {pointer-events: none;}"
                  , n = document.createElement("style");
                e.el.classList.add(i),
                n.appendChild(document.createTextNode(t)),
                document.head.appendChild(n),
                e.noPointerEventsStyleElement = n;
            }
        },
        _enablePointerEventsForChildren: function() {
            var e = this;
            e.noPointerEventsStyleElement && (e.el.classList.remove(i),
            document.head.removeChild(e.noPointerEventsStyleElement),
            e.noPointerEventsStyleElement = null );
        },
        _setDropEffectIfNeeded: function(e) {
            var i = this;
            i.dropEffect && t.setDropEffect(e, i.dropEffect);
        }
    });
}),
define("helpers/dnd/ItemDragEvent", ["project!core", "./workaroundstate", "./eventUtil"], function(e, t, i) {
    var n = e.WBClass.extend({
        initialize: function(e, t) {
            var i = this;
            i._nativeEvent = e,
            i._item = t;
        },
        findMatchingDropEffect: function(e) {
            return i.findMatchingDropEffect(this._nativeEvent, e);
        },
        findMatchingMimetype: function(e) {
            return i.findMatchingMimetype(this.mimeTypes, e);
        },
        isDropAllowedFor: function(e, t) {
            var i, n, o = this;
            return (i = o.findMatchingMimetype(e)) ? (n = o.findMatchingDropEffect(t),
            n ? !0 : !1) : !1;
        },
        setDropEffect: function(e) {
            i.setDropEffect(this._nativeEvent, e);
        },
        allowDrop: function() {
            return i.allowDrop(this._nativeEvent);
        },
        allowDropWithEffect: function(e) {
            var t = this
              , i = t.findMatchingDropEffect(e);
            return i ? (t.setDropEffect(i),
            t.allowDrop(),
            !0) : !1;
        }
    });
    return Object.defineProperty(n.prototype, "mimeTypes", {
        get: function() {
            return i.getDragMimetypes(this._nativeEvent);
        }
    }),
    Object.defineProperty(n.prototype, "position", {
        get: function() {
            var e = this;
            return {
                x: e._nativeEvent.clientX,
                y: e._nativeEvent.clientY
            };
        }
    }),
    Object.defineProperty(n.prototype, "item", {
        get: function() {
            return this._item;
        }
    }),
    n;
}),
define("helpers/dnd/ItemDropEvent", ["./ItemDragEvent", "./workaroundstate", "./eventUtil"], function(e, t, i) {
    var n = e.extend({
        getDragData: function(e) {
            return i.getDragData(this._nativeEvent, e);
        },
        acceptDrop: function() {
            return i.acceptDrop(this._nativeEvent);
        }
    });
    return n;
}),
define("helpers/dnd/ItemDragger", ["./BaseDragAndDropHandler", "./ItemDragEvent", "./ItemDropEvent", "./eventUtil"], function(e, t, i, n) {
    var o = e.prototype
      , a = e.extend({
        initialize: function(e) {
            var t = this;
            o.initialize.call(t),
            t.el = e,
            t.currentItem = null ,
            t.hasDragEndHandler = !1,
            t.setDOMEvents({
                dragenter: t._onDragEnter.bind(t),
                dragleave: t._onDragLeave.bind(t),
                dragover: t._onDragOver.bind(t),
                drop: t._onDrop.bind(t)
            });
        },
        _onDragEnter: function(e) {
            var i, o = this, a = n.getItemFromTarget(o.el, e.target);
            a !== o.currentItem && a && (i = new t(e,a),
            o.currentItem && o._leaveCurrentItem(e),
            o.currentItem = a,
            o.trigger("itementer", i));
        },
        _onDragEnd: function(e) {
            var t = this;
            t.currentItem && t._leaveCurrentItem(e),
            t.hasDragEndHandler = !1;
        },
        _onDragLeave: function(e) {
            var t, i, o, a = this, r = n.getItemFromTarget(a.el, e.target);
            a.currentItem && (r ? (i = a.currentItem.getBoundingClientRect(),
            o = {
                x: e.clientX,
                y: e.clientY
            },
            t = !1,
            (o.y < i.top || o.y > i.top + i.height) && (t = !0),
            (o.x < i.left || o.x > i.left + i.width) && (t = !0),
            t && a._leaveCurrentItem(e)) : a._leaveCurrentItem(e));
        },
        _onDragOver: function(e) {
            var i, n = this;
            n.currentItem && (i = new t(e,n.currentItem),
            n.trigger("itemover", i));
        },
        _onDrop: function(e) {
            var t, o = this, a = n.getItemFromTarget(o.el, e.target);
            a && (t = new i(e,a),
            o.trigger("itemdrop", t),
            o.currentItem && o._leaveCurrentItem(e));
        },
        _leaveCurrentItem: function(e) {
            var i = this
              , n = new t(e,i.currentItem);
            i.currentItem = null ,
            i.trigger("itemleave", n);
        }
    });
    return a;
}),
define("helpers/dnd/ItemDropZoneList", ["application/runtime", "project!core"], function(e, t) {
    function i(e, t, i) {
        return Math.min(Math.max(e, i), t);
    }
    var n = e._
      , o = t.BaseEventEmitter.extend({
        initialize: function(e, t) {
            var i = this;
            i.dropZones = t,
            i.itemDragger = e,
            i.currentDropZone = null ,
            i.bindTo(i.itemDragger, "itementer", i.onItemOverAndEnter),
            i.bindTo(i.itemDragger, "itemover", i.onItemOverAndEnter),
            i.bindTo(i.itemDragger, "itemleave", i.onItemLeave),
            i.bindTo(i.itemDragger, "itemdrop", i.onItemDrop);
        },
        onItemDrop: function(e) {
            var t = this;
            t.currentDropZone && (t.currentDropZone.onDrop(e),
            t.currentDropZone.onLeave(e),
            t.currentDropZone = null );
        },
        onItemLeave: function(e) {
            var t = this;
            t.currentDropZone && (t.currentDropZone.onLeave(e),
            t.currentDropZone = null );
        },
        onItemOverAndEnter: function(e) {
            var t = this
              , i = t._getDropZone(e.position, e.item)
              , n = t.currentDropZone !== i;
            t.currentDropZone && n && (t.currentDropZone.onLeave(e),
            t.currentDropZone = null ),
            i && (n ? (t.currentDropZone = i,
            t.currentDropZone.onEnter(e)) : t.currentDropZone.onOver(e));
        },
        _getDropZone: function(e, t) {
            var o = this
              , a = t.getBoundingClientRect()
              , r = {
                width: a.width,
                height: a.height
            }
              , s = {
                x: e.x - a.left,
                y: e.y - a.top
            };
            o.currentDropZone && o.currentDropZone.normalizePosition(r, s),
            s.x = i(0, r.width, s.x),
            s.y = i(0, r.height, s.y);
            var l = n.find(o.dropZones, function(e) {
                return e.matches(t, r, s);
            });
            return l;
        },
        onDestroy: function() {
            var e = this;
            e.itemDragger.destroy();
        },
        enable: function() {
            var e = this;
            e.itemDragger.enable();
        },
        disable: function() {
            var e = this;
            e.itemDragger.disable();
        }
    });
    return o;
}),
define("helpers/dnd/ItemDropZone", ["project!core"], function(e) {
    var t = e.BaseEventEmitter.extend({
        initialize: function(e) {
            var t = this;
            t.top = e.top || 0,
            t.left = e.left || 0,
            t.bottom = e.bottom || 0,
            t.right = e.right || 0,
            t.className = e.className,
            t.ratioArea = e.ratioArea,
            t.topArea = e.topArea,
            t.bottomArea = e.bottomArea,
            t.acceptedMimetypes = e.acceptedMimetypes,
            t._appliesToItemCallback = e.appliesToItem,
            t.dropEffects = ["move"];
        },
        isDropAllowed: function(e) {
            var t = this;
            return e.isDropAllowedFor(t.acceptedMimetypes, t.dropEffects);
        },
        isDragEventsAllowed: function(e) {
            var t = this;
            return e.isDropAllowedFor(t.acceptedMimetypes, t.dropEffects);
        },
        normalizePosition: function(e, t) {
            var i = this;
            t.y -= i.top,
            t.x -= i.left,
            e.height -= i.bottom,
            e.width -= i.right;
        },
        appliesToItem: function(e) {
            var t = this;
            return t._appliesToItemCallback ? t._appliesToItemCallback(e) : !0;
        },
        matches: function(e, t, i) {
            var n = this;
            return n.appliesToItem(e) ? n.topArea ? n._matchesTopArea(i) : n.bottomArea ? n._matchesBottomArea(i, t) : n.ratioArea ? n._matchesRatioArea(i, t) : !1 : !1;
        },
        _matchesRatioArea: function(e, t) {
            var i = this
              , n = e.y / t.height;
            return "number" == typeof i.ratioArea[0] && n <= i.ratioArea[0] ? !1 : "number" == typeof i.ratioArea[1] && n > i.ratioArea[1] ? !1 : !0;
        },
        _matchesTopArea: function(e) {
            var t = this
              , i = t.topArea[0]
              , n = t.topArea[1]
              , o = e.y <= i + n
              , a = e.y >= i;
            return o && a;
        },
        _matchesBottomArea: function(e, t) {
            var i = this
              , n = i.bottomArea[0]
              , o = i.bottomArea[1]
              , a = e.y <= t.height - n
              , r = e.y >= t.height - n - o;
            return a && r;
        },
        applyVisualFeedback: function(e) {
            var t = this;
            e.classList.add(t.className);
        },
        clearVisualFeedback: function(e) {
            var t = this;
            e.classList.remove(t.className);
        },
        onEnter: function(e) {
            var t = this;
            t.isDragEventsAllowed(e) && (e.allowDropWithEffect(t.dropEffects),
            t.applyVisualFeedback(e.item),
            t.trigger("itementer", e, e.findMatchingMimetype(t.acceptedMimetypes)));
        },
        onLeave: function(e) {
            var t = this;
            t.isDragEventsAllowed(e) && (t.trigger("itemleave", e, e.findMatchingMimetype(t.acceptedMimetypes)),
            t.clearVisualFeedback(e.item));
        },
        onOver: function(e) {
            var t = this;
            t.isDragEventsAllowed(e) && e.allowDropWithEffect(t.dropEffects);
        },
        onDrop: function(e) {
            var t = this;
            t.isDropAllowed(e) && (e.acceptDrop(),
            t.trigger("drop", e, e.findMatchingMimetype(t.acceptedMimetypes)));
        }
    });
    return t;
}),
define("helpers/dnd/SortableDropList", ["./ItemDropZoneList", "./ItemDropZone", "../domtools"], function(e, t, i) {
    var n = e.prototype
      , o = e.extend({
        initialize: function(e, i) {
            var o = this
              , a = new t({
                acceptedMimetypes: i.mimeTypes,
                className: i.dropTargetTopClass,
                top: i.dropTargetTopHeight,
                ratioArea: [null , .5]
            })
              , r = new t({
                acceptedMimetypes: i.mimeTypes,
                className: i.dropTargetBottomClass,
                bottom: i.dropTargetBottomHeight,
                ratioArea: [.5, null ]
            });
            n.initialize.call(o, e, [a, r]),
            o.bindTo(a, "drop", "_onTopZoneDropped"),
            o.bindTo(r, "drop", "_onBottomZoneDropped");
        },
        _onTopZoneDropped: function(e, t) {
            var n = this
              , o = e.item
              , a = i.previousElement(o);
            n.trigger("droppedBetween", e.getDragData(t), a, o, t);
        },
        _onBottomZoneDropped: function(e, t) {
            var n = this
              , o = e.item
              , a = i.nextElement(o);
            n.trigger("droppedBetween", e.getDragData(t), o, a, t);
        }
    });
    return o;
}),
define("helpers/dnd/DropList", ["project!core"], function(e) {
    var t = e.BaseEventEmitter
      , i = t.prototype;
    return t.extend({
        initialize: function(e, t) {
            var n = this;
            if (i.initialize.call(n, {}),
            n.itemDragger = e,
            !t.className)
                throw new Error("missing className option");
            n.bindTo(n.itemDragger, "itementer", n.onItemEnter),
            n.bindTo(n.itemDragger, "itemleave", n.onItemLeave),
            n.bindTo(n.itemDragger, "itemover", n.onItemOver),
            n.bindTo(n.itemDragger, "itemdrop", n.onItemDrop),
            n._appliesToItemCallback = t.appliesToItem,
            n.className = t.className,
            n.acceptedMimetypes = t.acceptedMimetypes,
            n.dropEffects = ["move", "copy"];
        },
        _isDropAllowed: function(e) {
            var t = this;
            if (t._appliesToItemCallback && !t._appliesToItemCallback(e.item))
                return !1;
            var i = e.isDropAllowedFor(t.acceptedMimetypes, t.dropEffects);
            return i;
        },
        onItemEnter: function(e) {
            var t = this;
            t._isDropAllowed(e) && (e.allowDropWithEffect(t.dropEffects),
            e.item.classList.add(t.className));
        },
        onItemOver: function(e) {
            var t = this;
            t._isDropAllowed(e) && e.allowDropWithEffect(t.dropEffects);
        },
        onItemLeave: function(e) {
            var t = this;
            t._isDropAllowed(e) && e.item.classList.remove(t.className);
        },
        onItemDrop: function(e) {
            var t, i, n = this;
            n._isDropAllowed(e) && (e.acceptDrop(),
            t = e.findMatchingMimetype(n.acceptedMimetypes),
            i = e.getDragData(t),
            n.trigger("drop", e.item, i));
        },
        onDestroy: function() {
            var e = this;
            e.itemDragger.destroy(),
            i.onDestroy.call(e);
        },
        enable: function() {
            var e = this;
            e.itemDragger.enable();
        },
        disable: function() {
            var e = this;
            e.itemDragger.disable();
        }
    });
}),
define("helpers/dnd/index", ["./DragList", "./DropZone", "./ItemDragger", "./SortableDropList", "./DropList"], function(e, t, i, n, o) {
    return {
        createDragList: function(t, i) {
            return new e(t,i);
        },
        createDropZone: function(e, i) {
            return new t(e,i);
        },
        createDropList: function(e, t) {
            var n = new i(e);
            return new o(n,t);
        },
        createDropBetweenList: function(e, t) {
            var o = new i(e)
              , a = new n(o,t);
            return a;
        }
    };
}),