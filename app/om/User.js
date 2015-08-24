// Tracks global metadata for a file in the review, not tied to any iteration
define([], function () {
    'use strict';

    const proto = {
        is: function (otherUser) {
            return otherUser
                && Object.getPrototypeOf(otherUser) === proto
                && otherUser.email.toLocaleLowerCase() === this.email.toLocaleLowerCase();
        },

        toString: function () {
            return `${this.name} <${this.email}>`.trim();
        },

        getAvatarUrl: function (size) {
            return `http://www.gravatar.com/avatar/${SparkMD5.hash(this.email.toLowerCase())}?s=${size || 28}&d=retro`;
        }
    };

    function User(displayName, email) {
        const obj = Object.create(proto);
        obj.name = displayName.trim();
        obj.email = email.trim();
        return obj;
    }

    User.parse = function (str) {
        const parts = /\s*([^<]*?)\s*<(([^@]+).+)>\s*$/.exec(str);
        const name = parts && (parts[1] || parts[3]) || 'NAME_MISSING';
        const email = parts && parts[2] || 'EMAIL_MISSING';

        return User(name.trim(), email.trim());
    };

    return User;
});
