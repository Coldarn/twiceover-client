// A single user comment in a review
define([
    'util/Util'
], function (Util) {
    'use strict';
    
    const proto = {
        id: null,           // UUID of this comment
        user: null,         // User who posted the comment
        date: null,         // When the comment was posted
        code: null,         // Optional code-based comment
        note: null,         // Optional plain-text comment
        
        // Only used for sorting
        toString: function () {
            return this.date;
        }
    };
    
    return function Comment(user, code, note, date, id) {
        const obj = Object.create(proto);
        
        obj.id = id || Util.randomID();
        obj.user = user;
        obj.date = date || 0;
        obj.code = code || '';
        obj.note = note || '';
        
        return obj;
    };
});