// Collection of iterations for a code review
define([
    'om/Iteration'
], function (Iteration) {
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
    };
});
