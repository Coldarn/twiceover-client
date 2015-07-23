// A single user comment in a review
define([], function () {
    'use strict';
    
    const proto = {
        user: null,         // User who posted the comment
        date: null,         // When the comment was posted
        code: null,         // Optional code-based comment
        text: null,         // Optional plain-text comment
        
        // Only used for sorting
        toString: function () {
            return this.date;
        }
    };
    
    return function Comment(user, code, text) {
        const obj = Object.create(proto);
        
        obj.user = user;
        obj.date = new Date().toISOString();
        obj.code = code || null;
        obj.text = text || null;
        
        return obj;
    };
});