define([
    'util/Util',
    'util/ElementProxy'
], function (Util, ElementProxy) {
    'use strict';
    
    const proto = {
        el: null,
        
        setHtml: function (htmlOrPath) {
            var me = this;
            
            htmlOrPath = htmlOrPath || me.el;
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
            this.destroy();
            this.el = el;
            this.el.component = this;
            this.initComponent();
            if (this.pendingParentEl) {
                this.pendingParentEl.appendChild(this.el);
                delete this.pendingParentEl;
            }
        },
        
        initComponent: function () {
        },
        
        setVisible: function (visible) {
            this.el.style.display = visible ? null : 'none';
            return this;
        },
        
        query: function (selector) {
            return ElementProxy(this.el.querySelector(selector));
        },
        
        queryAll: function (selector) {
            return ElementProxy(this.el.querySelectorAll(selector));
        },
        
        appendTo: function (parentEl) {
            if (this.el && typeof this.el !== 'string') {
                (parentEl.el || parentEl[0] || parentEl).appendChild(this.el);
            } else {
                this.pendingParentEl = parentEl;
            }
            return this;
        },
        
        append: function (childEls) {
            var me = this;
            
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
        
        destroy: function () {
            if (this.el && typeof this.el !== 'string') {
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
