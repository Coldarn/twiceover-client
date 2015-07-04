// Collection of iterations for a code review
define([
    'om/Iteration'
], function (Iteration) {
    'use strict';
    
    var proto = {
        // Creates, adds, and returns a new iteration to this review
        addIteration: function () {
            var iteration = Iteration();
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

    return function Review() {
        var obj = Object.create(proto);

        obj.iterations = [];          // Array of Iterations

        return obj;
    };
});
