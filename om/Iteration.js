// File collection for a single iteration in a code review
define([
    'om/FileEntry'
], function (FileEntry) {
    'use strict';
    
    var proto = {
        // Adds the given entry to the iteration
        addEntry: function (entry) {
            this.entryOrder.push(entry.path);
            this.entries[entry.path] = entry;
            return entry;
        },

        // Returns an entry by path
        getEntry: function (path) {
            return this.entries[path];
        },

        // Returns an array of all entry file paths
        getPaths: function () {
            return this.entryOrder.slice();
        }
    };

    return function Iteration(entries) {
        var obj = Object.create(proto);

        obj.entryOrder = [];    // Order of entries
        obj.entries = {};       // Entry lookup
        
        if (entries) {
            entries.forEach(function (entry) {
                obj.entryOrder.push(entry.path);
                obj.entries[entry.path] = entry;
            });
        }

        return obj;
    };
});
