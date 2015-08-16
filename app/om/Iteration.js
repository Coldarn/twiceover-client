// File collection for a single iteration in a code review
define([
    'util/Util',
    'util/EventLog',
    'om/FileEntry'
], function (Util, EventLog, FileEntry) {
    'use strict';
    
    var proto = {
        // Adds the given entry to the iteration
        addEntry: function (entry) {
            this.eventLog.add({
                type: 'newEntry',
                data: {
                    iterationID: this.id,
                    path: entry.path,
                    diskPath: entry.diskPath,
                    errorMessage: entry.errorMessage,
                    content: entry.content
                }
            });
        },

        // Returns an entry by path
        getEntry: function (path) {
            return this.entries[path.toLowerCase()];
        },

        // Returns an array of all entry file paths
        getPaths: function () {
            return this.entryOrder.slice();
        },
        
        
        
        
        handleEvent: function (event) {
            switch (event.type) {
                case 'newEntry':
                    if (event.data.iterationID === this.id) {
                        const entry = FileEntry(
                            event.data.content,
                            event.data.diskPath,
                            event.data.path,
                            event.data.errorMessage
                        );

                        this.entryOrder.push(entry.path);
                        this.entries[entry.path.toLowerCase()] = entry;
                    }
                    break;
            }
        }
    };

    function Iteration() {
        const eventLog = EventLog();
        eventLog.add({
            type: 'newIteration',
            data: {
                id: Util.randomID()
            }
        });
        return Iteration.load(eventLog, eventLog.log[0]);
    };
    
    Iteration.load = function (eventLog, createEvent) {
        var obj = Object.create(proto);

        obj.id = createEvent.data.id;   // UUID for this instance
        obj.index = null;               // Index of this iteration in the review
        obj.entryOrder = [];            // Order of entries
        obj.entries = {};               // Entry lookup

        obj.eventLog = eventLog;
        obj.eventLog.subscribe(obj.handleEvent, obj);

        return obj;
    };
    
    return Iteration;
});
