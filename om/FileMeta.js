// Tracks global metadata for a file in the review, not tied to any iteration
define([], function () {
    'use strict';
    
    const proto = {
        path: null,         // Path of this file
        comments: null,     // Maps comment locations to sorted arrays of comments
        
        addComment: function (location, comment) {
            const locationHash = location.toString(),
                commentArray = this.comments[locationHash];
            
            if (!commentArray) {
                this.comments[locationHash] = commentArray = [];
            }
            commentArray.push(comment);
            commentArray.sort();
        }
    };
    
    return function FileMeta(path) {
        const obj = Object.create(proto);
        
        obj.path = path;
        obj.comments = {};
        
        return obj;
    };
});