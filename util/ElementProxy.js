define([
    'util/Util'
], function (Util) {
    'use strict';
    
    const proto = {
        __proto__: Array.prototype,
        
        on: function (eventName, handler) {
            this.forEach(function (el) {
                el.addEventHandler(eventName, handler);
            });
            return this;
        },
        
        setVisible: function (visible) {
            this.forEach(function (el) {
                el.style.display = visible ? null : 'none';
            });
            return this;
        }
    };
    
    return function ElementProxy(nodeList) {
        const obj = Object.create(proto);
        obj.push.apply(obj, nodeList);
        return obj;
    };
});