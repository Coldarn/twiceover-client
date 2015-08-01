// Collection of iterations for a code review
define([
    'util/Util',
    'util/EventLog',
    'om/Iteration',
    'om/FileMeta',
    'om/User'
], function (Util, EventLog, Iteration, FileMeta, User) {
    'use strict';
    
    var proto = {
        // Creates, adds, and returns a new iteration to this review
        addIteration: function (iteration) {
            this.eventLog.mergeIn(iteration.eventLog);
        },
        
        // Returns the Iteration at the given index
        getIteration: function (iteration) {
            if (typeof iteration === 'number') {
                if (iteration < 0 || iteration >= this.iterations.length) {
                    throw new Error(`Invalid iteration index passed: ${iteration}`);
                }
                return this.iterations[iteration];
            } else {
                const foundIt = Util.find(this.iterations, function (it) { return it.id === iteration.id; });
                if (!foundIt) {
                    throw new Error('Iteration not found in this review: ${iteration.id}');
                }
                return foundIt;
            }
        },
        
        // Returns the metadata class for the given file path
        getFileMeta: function (path) {
            return this.fileMetas[path.toLowerCase()];
        },




        handleEvent: function (event) {
            switch (event.type) {
                case 'newReview': {
                    this.owningUser = User.parse(event.user);
                    this.title = event.data.title;
                    this.description = event.data.description;
                    break;
                }
                case 'newIteration': {
                    const iteration = Iteration.load(this.eventLog, event);
                    iteration.index = this.iterations.length;
                    this.iterations.push(iteration);
                    break;
                }
                case 'newEntry': {
                    const lowerPath = event.data.path.toLowerCase();
                    if (!this.fileMetas[lowerPath]) {
                        this.fileMetas[lowerPath] = FileMeta(this.eventLog, event.data.path);
                    }
                    break;
                }
            }
        },
    };

    function Review(user, title, description) {
        const eventLog = EventLog(user).add({
            type: 'newReview',
            data: {
                title: title,
                description: description
            }
        });
        return Review.load(eventLog);
    };
    
    Review.load = function load(eventLog) {
        var obj = Object.create(proto);

        obj.eventLog = eventLog;
        obj.iterations = [];          // Array of Iterations
        obj.fileMetas = {};           // Map of file paths to metadata for all files in the review
        
        eventLog.processEventsSince(0, obj.handleEvent.bind(obj));
        eventLog.subscribe(obj.handleEvent, obj);

        return obj;
    };
    
    return Review;
});
