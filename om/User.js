// Tracks global metadata for a file in the review, not tied to any iteration
define([], function () {
    'use strict';
   
    const proto = {
        is: function (otherUser) {
            return otherUser
                && Object.getPrototypeOf(otherUser) === proto
                && otherUser.email.toLocaleLowerCase() == this.email.toLocaleLowerCase();
        }
    };
    
    return function User(displayName, email) {
        const obj = Object.create(proto);
        obj.name = displayName.trim();
        obj.email = email.trim();
        return obj;
    };
});