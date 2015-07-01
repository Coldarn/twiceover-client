
// A single version of a file in a code review
var Entry = (function () {
    var proto = {
    };

    return function Entry(content, path, errorMessage) {
        var obj = Object.create(proto);

        obj.content = content;          // String content of the file or null if it couldn't be loaded
        obj.path = path;                // Path to the file, for display in the UI
        obj.comments = [];              // Array of source comments objects
        obj.errorMessage = errorMessage;     // Error message string if the file couldn't be loaded

        return obj;
    }
}());


// File collection for a single iteration in a code review
var Iteration = (function () {
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
    }
}());


// Collection of iterations for a code review
var Review = (function () {
    var proto = {
        // Creates, adds, and returns a new iteration to this review
        addIteration: function () {
            var iteration = Iteration();
            this.iterations.push(iteration);
            return iteration;
        },
        
        serialize: function () {
            return JSON.stringify(this);
        }
    };

    return function Review() {
        var obj = Object.create(proto);

        obj.iterations = [];          // Array of Iterations

        return obj;
    }
}());