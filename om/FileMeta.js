// Tracks global metadata for a file in the review, not tied to any iteration
define([], function () {
    'use strict';
    
    const proto = {
        path: null,         // Display path of this file
        comments: null,     // Maps comment locations to sorted arrays of comments
        
        // Adds the given comment at the specified CommentLocation
        addComment: function (location, comment) {
            const locationHash = location.toString(),
                commentArray = this.comments[locationHash];
            
            if (!commentArray) {
                this.comments[locationHash] = commentArray = [];
            }
            commentArray.push(comment);
            commentArray.sort();
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
        }
    };
    
    return function FileMeta(displayPath) {
        const obj = Object.create(proto);
        
        obj.path = displayPath;
        obj.comments = {};
        
        return obj;
    };
});