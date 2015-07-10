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
        },
        
        appendTo: function (parentEl) {
            this.parentEl = parentEl;
            if (this.el && typeof this.el !== 'string') {
                this.parentEl.appendChild(this.el);
            }
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
