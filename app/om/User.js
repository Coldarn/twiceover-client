// Tracks global metadata for a file in the review, not tied to any iteration
define([], function () {
    'use strict';

    function tryParse(str) {
        const parts = /\s*([^<]*?)\s*<(([^@]+).+)>\s*$/.exec(str);
        const name = parts && (parts[1] || parts[3]) || '';
        const email = parts && parts[2] || '';

        return email ? { name: name.trim(), email: email.trim() } : null;
    }

    const proto = {
        is: function (otherUser) {
            if (proto.isPrototypeOf(otherUser)) {
                return otherUser.email.toLocaleLowerCase() === this.email.toLocaleLowerCase();
            }
            const other = User(otherUser);
            return other.email.toLocaleLowerCase() === this.email.toLocaleLowerCase();
        },

        toString: function () {
            return this.name ? `${this.name} <${this.email}>` : this.email;
        },

        getAvatarUrl: function (size) {
            return `http://www.gravatar.com/avatar/${SparkMD5.hash(this.email.toLowerCase())}?s=${size || 28}&d=retro`;
        }
    };

    function User(displayName, email) {
        const obj = Object.create(proto);
        if (proto.isPrototypeOf(displayName)) {
            return displayName;
        } else if (!displayName || typeof displayName !== 'string') {
            throw new Error('Email address string is required at minimum to construct a user');
        } else  if (displayName && email) {
            obj.name = displayName.trim();
            obj.email = email.trim();
        } else if (displayName.indexOf('@') >= 0) {
            const parsed = tryParse(displayName);
            if (parsed) {
                obj.name = parsed.name;
                obj.email = parsed.email;
            } else {
                obj.name = '';
                obj.email = displayName.trim();
            }
        } else {
            throw new Error("Cannot parse as user: " + displayName)
        }
        return obj;
    }

    return User;
});
