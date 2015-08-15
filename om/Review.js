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
        eventLog: null,         // EventLog driving this review
        iterations: null,       // Ordered array of Iterations
        fileMetas: null,        // Object mapping lowercase file paths to FileMetas
        
        
        id: null,               // Unique ID for this review
        owningUser: null,       // User that created this review
        title: null,            // Review's title
        description: null,      // Review's description
        reviewers: null,        // Array of reviewers
        
        
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
        
        // Searches through all FileMetas to find the comment with the given ID and
        // returns an object describing its location or null if not found
        findComment: function (commentID) {
            for (let path in this.fileMetas) {
                let fileMeta = this.fileMetas[path];
                const info = fileMeta.findComment(commentID);
                if (info) {
                    info.fileMeta = fileMeta;
                    return info;
                }
            }
            return null;
        },




        handleEvent: function (event) {
            switch (event.type) {
                case 'newReview': {
                    this.id = event.data.id;
                    this.owningUser = User.parse(event.user);
                    this.title = event.data.title;
                    this.description = event.data.description;
                    this.reviewers = event.data.reviewers;
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

    function Review(user, title, description, reviewers) {
        const eventLog = EventLog(user).add({
            type: 'newReview',
            data: {
                id: Util.randomID(),
                title: title,
                description: description,
                reviewers: reviewers.map(function (u) { return u.toString(); })
            }
        });
        return Review.load(eventLog);
    };
    
    Review.load = function load(eventLog) {
        var obj = Object.create(proto);

        obj.eventLog = eventLog;
        obj.iterations = [];
        obj.fileMetas = {};
        
        eventLog.subscribe(obj.handleEvent, obj);
        eventLog.processEventsSince(0);

        return obj;
    };
    
    return Review;
});
