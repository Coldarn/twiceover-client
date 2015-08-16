define([
    'util/Util'
], function (Util) {
    'use strict';
    
    var self = {
        handlers: {},
        
        on: function (eventName, handler, scope) {
            this.handlers[eventName] = this.handlers[eventName] || [];
            this.handlers[eventName].push([handler, scope]);
        },
        
        off: function (eventName, handler, scope) {
            const handlers = this.handlers[eventName];
            if (!handlers) {
                throw new Error(`No handlers for "${eventName}" subscribed!`);
            }
            
            const index = Util.findIndex(handlers, function (tuple) {
                return tuple[0] === handler && tuple[1] === scope;
            });
            if (index < 0) {
                throw new Error(`Handlers for "${eventName}" not subscribed!`);
            }
            
            handlers.splice(index, 1);
        },
        
        fire: function (eventName) {
            const handlers = this.handlers[eventName];
            if (handlers) {
                var args = Array.prototype.slice.call(arguments, 1);
                handlers.forEach(function (handler) {
                    handler[0].apply(handler[1], args);
                });
            }
        }
    };
    
    return self;
});