define([
    'util/Util',
    'util/ElementProxy'
], function (Util, ElementProxy) {
    'use strict';
    
    const proto = {
        el: null,
        
        setHtml: function (htmlOrPath) {
            var me = this;
            
            htmlOrPath = htmlOrPath;
            if (typeof htmlOrPath !== 'string') {
                return;
            }
            
            function setEl(htmlStr) {
                me.setEl(new Range().createContextualFragment(htmlStr).firstChild);
            }

            if (htmlOrPath.startsWith('text!')) {
                requirejs([htmlOrPath], setEl);
            } else {
                setEl(htmlOrPath);
            }
        },
        
        setEl: function (el) {
            var me = this;
            
            me.destroy();
            me.el = el;
            me.el.component = this;
            me.initComponent();
            if (me.pendingLoadCallbacks) {
                me.pendingLoadCallbacks.forEach(function (callback) {
                    callback(me);
                });
                delete me.pendingLoadCallbacks;
            }
        },
        
        initComponent: function () {
        },
        
        setVisible: function (visible) {
            this.el.style.display = visible ? null : 'none';
            return this;
        },
        
        on: function (eventName, handlerFn) {
            if (this.el) {
                this.el.addEventListener(eventName, handlerFn);
            } else {
                this.whenLoaded(function (me) { me.el.addEventListener(eventName, handlerFn); });
            }
            return this;
        },
        
        query: function (selector) {
            return ElementProxy(this.el.querySelector(selector));
        },
        
        queryAll: function (selector) {
            return ElementProxy(this.el.querySelectorAll(selector));
        },
        
        appendTo: function (parentEl) {
            if (this.el) {
                (parentEl.el || parentEl[0] || parentEl).appendChild(this.el);
            } else {
                this.whenLoaded(function (me) { (parentEl.el || parentEl[0] || parentEl).appendChild(me.el); });
            }
            return this;
        },
        
        prependTo: function (parentEl) {
            parentEl = parentEl.el || parentEl[0] || parentEl;
            if (this.el) {
                parentEl.insertBefore(this.el, parentEl.firstChild);
            } else {
                this.whenLoaded(function (me) { parentEl.insertBefore(me.el, parentEl.firstChild); });
            }
            return this;
        },
        
        append: function (childEls) {
            const me = this;
            
            if (childEls.el) {
                me.el.appendChild(childEls.el);
            } else if (Util.isElement(childEls)) {
                me.el.appendChild(childEls);
            } else {
                childEls.forEach(function (el) {
                    me.append(el);
                });
            }
            return me;
        },
        
        whenLoaded: function (callback) {
            var me = this;
            me.pendingLoadCallbacks = me.pendingLoadCallbacks || [];
            me.pendingLoadCallbacks.push(callback);
            return me;
        },
        
        destroy: function () {
            if (this.el) {
                if (this.dispose) {
                    this.dispose();
                }
                this.el.remove();
            }
        }
    };
    
    function Component(html) {
        if (html && Util.isElement(html)) {
            if (html.component) {
                return html.component;
            }
            var obj = Object.create(proto);
            obj.setEl(html);
            return obj;
        }
        
        var obj = Object.create(proto);
        obj.setHtml(html);
        return obj;
    }
    
    Component.prototype = proto;
    
    return Component;
});
