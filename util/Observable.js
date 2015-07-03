define(function () {
    'use strict';
    
    var proto = {
        subscribe: function (handler) {
            if (!this._handlers) {
                this._handlers = [];
            }
            if (this._handlers.indexOf(handler) < 0) {
                this._handlers.push(handler);
            }
        },
        
        unsubscribe: function (handler) {
            this._handlers.splice(this._handlers.indexOf(handler), 1);
        },
        
        fireEvent: function (name) {
            if (this._handlers) {
                this._handlers.forEach(function (handler) {
                    if (handler[name]) {
                        handler[name].apply(handler, Array.prototype.slice.call(arguments, 1));
                    }
                });
            }
        }
    };
    
    function Observable() {
        return Object.create(proto);
    };
    Observable.prototype = proto;
    
    return Observable;
});