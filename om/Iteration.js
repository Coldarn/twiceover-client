// File collection for a single iteration in a code review
define([
    'om/FileEntry'
], function (FileEntry) {
    'use strict';
    
    var proto = {
        // Adds the given entry to the iteration
        addEntry: function (entry) {
            if (typeof this.index === 'number') {
                throw new Error('Cannot modify an iteration after adding it to a review!');
            }
            
            const pathLower = entry.path.toLowerCase();
            
            this.entryOrder.push(pathLower);
            this.entries[pathLower] = entry;
            
            return entry;
        },

        // Returns an entry by path
        getEntry: function (path) {
            return this.entries[path.toLowerCase()];
        },

        // Returns an array of all entry file paths
        getPaths: function () {
            return this.entryOrder.slice();
        }
    };

    return function Iteration(entries) {
        var obj = Object.create(proto);

        obj.index = null;       // Index of this iteration in the review
        obj.entryOrder = [];    // Order of entries
        obj.entries = {};       // Entry lookup
        
        if (entries) {
            entries.forEach(obj.addEntry.bind(obj));
        }

        return obj;
    };
});
