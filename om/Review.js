// Collection of iterations for a code review
define([
    'om/Iteration',
    'om/FileMeta'
], function (Iteration, FileMeta) {
    'use strict';
    
    var proto = {
        // Creates, adds, and returns a new iteration to this review
        addIteration: function (iteration) {
            var me = this;
            
            iteration.index = this.iterations.length;
            this.iterations.push(iteration);
            
            iteration.entryOrder.forEach(function (path) {
                const lowerPath = path.toLowerCase();
                if (!me.fileMetas[lowerPath]) {
                    me.fileMetas[lowerPath] = FileMeta(path);
                }
            });
        },
        
        // Returns the Iteration at the given index
        getIteration: function (iteration) {
            if (typeof iteration === 'number') {
                if (iteration < 0 || iteration >= this.iterations.length) {
                    throw new Error(`Invalid iteration index passed: ${iteration}`);
                }
                return this.iterations[iteration];
            } else {
                if (this.iterations.indexOf(iteration) < 0) {
                    throw new Error('Iteration not found in this review!');
                }
                return iteration;
            }
        },
        
        // Returns the metadata class for the given file path
        getFileMeta: function (path) {
            return this.fileMetas[path.toLowerCase()];
        },

        serialize: function () {
            return JSON.stringify(this);
        }
    };

    return function Review(owningUser, title, description) {
        var obj = Object.create(proto);

        obj.owningUser = owningUser;
        obj.title = title.trim();
        obj.description = description ? description.trim() : '';
        obj.iterations = [];          // Array of Iterations
        obj.fileMetas = {};           // Map of file paths to metadata for all files in the review

        return obj;
    };
});
