// Tracks global metadata for a file in the review, not tied to any iteration
define([], function () {
    'use strict';
    
    const proto = {
        path: null,         // Display path of this file
        comments: null,     // Maps comment locations to sorted arrays of comments
        
        // Adds the given comment at the specified CommentLocation
        addComment: function (location, comment) {
            this.eventLog.add({
                type: 'addComment',
                data: {
                    path: this.path.toLowerCase(),
                    location: location.toString(),
                    code: comment.code,
                    note: comment.note
                }
            });
        },
        
        // Returns all comment locations for this file in sorted order
        getCommentLocations: function () {
            return Object.keys(this.comments)
                .sort()
                .map(function (locHash) { return CommentLocation(locHash); });
        },
        
        // Returns the sorted set of comments at the given location
        getCommentsAtLocation: function (location) {
            return this.comments[location.toString()];
        },
        
        // Returns all comments for this file ordered by iteration and line numbers
        getAllComments: function () {
            const commentArrays = this.getCommentLocations()
                .map(this.getCommentsAtLocation.bind(this));
            
            return Array.prototype.concat.apply([], commentArrays);
        },
        
        
        
        
        handleEvent: function (event) {
            switch (event.type) {
                case 'addComment':
                    if (event.data.path === this.path.toLowerCase()) {
                        const commentArray = this.comments[event.data.location],
                              comment = Comment(
                                  User.parse(event.user),
                                  event.data.code,
                                  event.data.note,
                                  event.id
                              );

                        if (!commentArray) {
                            this.comments[event.data.location] = commentArray = [];
                        }
                        commentArray.push(comment);
                        commentArray.sort();
                    }
                    break;
            }
        }
    };
    
    return function FileMeta(eventLog, displayPath) {
        const obj = Object.create(proto);
        
        obj.path = displayPath;
        obj.comments = {};
        
        obj.eventLog = eventLog;
        obj.eventLog.subscribe(obj.handleEvent, obj);
        
        return obj;
    };
});