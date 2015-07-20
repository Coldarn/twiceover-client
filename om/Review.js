// Collection of iterations for a code review
define([
    'om/Iteration'
], function (Iteration) {
    'use strict';
    
    var proto = {
        // Creates, adds, and returns a new iteration to this review
        addIteration: function () {
            var iteration = Iteration(this.iterations.length);
            this.iterations.push(iteration);
            return iteration;
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

        serialize: function () {
            return JSON.stringify(this);
        }
    };

    return function Review(title, description) {
        var obj = Object.create(proto);

        obj.title = title.trim();
        obj.description = description || '';
        obj.iterations = [];          // Array of Iterations

        return obj;
    };
});
