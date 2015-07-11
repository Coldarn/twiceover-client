define([
    'util/Util'
], function (Util) {
    'use strict';
    
    var proto = {
        el: null,
        parentEl: null,
        
        loadHtml: function (htmlOrPath) {
            var me = this;
            
            htmlOrPath = htmlOrPath || me.el;
            if (typeof htmlOrPath !== 'string') {
                return;
            }
            
            function setEl(htmlStr) {
                me.destroy();
                me.el = new Range().createContextualFragment(htmlStr).firstChild;
                me.el.component = me;
                me.initComponent();
                if (me.parentEl) {
                    me.parentEl.appendChild(me.el);
                }
            }

            if (htmlOrPath.startsWith('text!')) {
                requirejs([htmlOrPath], setEl);
            } else {
                setEl(htmlOrPath);
            }
        },
        
        initComponent: function () {
        },
        
        setVisible: function (visible) {
            this.el.style.display = visible ? null : 'none';
            return this;
        },
        
        appendTo: function (parentEl) {
            this.parentEl = parentEl;
            if (this.el && typeof this.el !== 'string') {
                this.parentEl.appendChild(this.el);
            }
            return this;
        },
        
        append: function (childEls) {
            var me = this;
            
            if (childEls.el) {
                me.el.appendChild(childEls.el);
            } else if (childEls.nodeType === 1 && typeof childEls.nodeName === "string") {
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
        var obj = Object.create(proto);
        obj.loadHtml(html);
        return obj;
    }
    
    Component.prototype = proto;
    
    return Component;
});
