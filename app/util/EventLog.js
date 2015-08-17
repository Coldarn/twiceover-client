define([
    'util/Util'
], function (Util) {
    'use strict';

    var proto = {
        log: null,

        subscribe: function (listener, scope) {
            this.listeners.push([listener, scope]);
            return this;
        },

        unsubscribe: function (listener, scope) {
            const index = Util.findIndex(this.listeners, function (tuple) {
                return tuple[0] === listener && tuple[1] === scope;
            });
            if (index < 0) {
                throw new Error(`Listener not subscribed!`);
            }

            this.listeners.splice(index, 1);
            return this;
        },

        add: function (event, keepTimestamp) {
            if (!event.type) {
                throw new Error(`Event malformed: ${JSON.stringify(event)}`);
            }
            
            event.id = keepTimestamp && event.id || Util.highResTime();
            event.user = String(event.user || this.currentUser);
            
            this.log.push(event);
            
            this.listeners.forEach(function (listener) {
                listener[0].call(listener[1], event);
            });
            return this;
        },
        
        // Merges events from the given log into this one, rewriting IDs along the way
        mergeIn: function (eventLog) {
            eventLog.log.forEach(this.add.bind(this));
        },
        
        processEventsSince: function (lastEventID) {
            const startIndex = Util.bisectSearch(this.log, function (event) {
                return lastEventID - event.id;
            });
            
            for (let i = Math.max(startIndex, 0); i < this.log.length; i += 1) {
                const event = this.log[i];
                this.listeners.forEach(function (listener) {
                    listener[0].call(listener[1], event);
                });
            }
            return this;
        }
    };

    function EventLog(currentUser) {
        if (!currentUser) {
            throw new Error('Must provide current user!');;
        }
        
        const obj = Object.create(proto);
        obj.listeners = [];
        obj.log = [];
        obj.currentUser = currentUser.toString();
        return obj;
    }
    
    EventLog.load = function (currentUser, events) {
        const obj = EventLog(currentUser);
        obj.log = events;
        return obj;
    };
    
    return EventLog;
});