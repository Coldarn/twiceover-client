// File collection for a single iteration in a code review
define([
    'om/FileEntry'
], function (FileEntry) {
    var proto = {
        // Adds the given entry to the iteration
        addEntry: function (entry) {
            this.entries.push(entry);
            return entry;
        },

        getEntry: function (path) {
            var index = this.getPaths().indexOf(path);
            return index >= 0 ? this.entries[index] : null;
        },

        // Returns an array of all entry file paths
        getPaths: function () {
            return this.entries.map(function (entry) {
                return entry.path;
            });
        }
    };

    return function Iteration(entries) {
        var obj = Object.create(proto);

        obj.entries = entries || [];    // Array of Entries

        return obj;
    };
});
