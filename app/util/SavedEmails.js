define([
    'util/Util',
    'om/User'
], function (Util, User) {
    'use strict';

    const savedEmails = JSON.parse(localStorage.getItem('emails') || '[]').map(User);

    function save() {
        localStorage.setItem('emails', JSON.stringify(savedEmails.map(function (user) {
            return user.toString();
        })));
    }

    return {
        add: function (email) {
            const user = User(email);
            if (!savedEmails.some(function (e) { return e.is(user); })) {
                savedEmails.push(user);
                save();
            }
        },

        findMatches: function (query, otherMatches) {
            const matches = [];
            query = query.toUpperCase();
            savedEmails.concat(otherMatches).forEach(function (e) {
                const name = e.name.toUpperCase();
                const email = e.email.toUpperCase();
                if (name.startsWith(query) || email.startsWith(query)) {
                    matches.push({ user: e, score: 2 });
                } else if (name.indexOf(query) > 0 || email.indexOf(query) > 0) {
                    matches.push({ user: e, score: 1 });
                }
            });

            return matches.sort(function (left, right) {
                return left.score >= right.score ? -1 : 1;
            }).map(function (e) { return e.user; });
        }
    };
});
