// Tracks global metadata for a file in the review, not tied to any iteration
define([
    'util/Util',
    'om/User',
    'om/CommentLocation',
    'om/Comment'
], function (Util, User, CommentLocation, Comment) {
    'use strict';

    const proto = {
        path: null,             // Display path of this file
        commentLocations: null, // Maps comment location strings to sorted arrays of comments
        comments: null,         // Maps comment IDs to their instances

        // Adds the given comment at the specified CommentLocation
        addComment: function (location, comment) {
            if (this.comments[comment.id]) {
                throw new Error(`Comment already exists with ID: ${comment.id}`);
            }
            this.eventLog.add({
                type: 'addComment',
                data: {
                    path: this.path.toLowerCase(),
                    location: location.toString(),
                    id: comment.id,
                    code: comment.code,
                    note: comment.note
                }
            });
        },

        editComment: function (commentID, changedProperty, newValue) {
            if (!this.comments[commentID]) {
                throw new Error(`No comment on this file with ID: ${commentID}`);
            } else if (['code', 'note'].indexOf(changedProperty) < 0) {
                throw new Error(`Cannot edit property '${changedProperty}' for a comment!`);
            }
            this.eventLog.add({
                type: 'editComment',
                data: {
                    id: commentID,
                    edited: changedProperty,
                    value: newValue
                }
            });
        },

        removeComment: function (commentID) {
            if (!this.comments[commentID]) {
                throw new Error(`No comment on this file with ID: ${commentID}`);
            }
            const locInfo = this.findComment(commentID);
            this.eventLog.add({
                type: 'removeComment',
                data: {
                    path: this.path.toLowerCase(),
                    location: locInfo.location.toString(),
                    id: commentID,
                }
            });
        },

        // Returns the comment with the given ID or null if unknown
        getComment: function (commentID) {
            return this.comments[commentID] || null;
        },

        // Returns all comment locations for this file in sorted order
        getCommentLocations: function () {
            return Object.keys(this.commentLocations)
                .sort()
                .map(function (locHash) { return CommentLocation(locHash); });
        },

        // Returns the sorted set of comments at the given location
        getCommentsAtLocation: function (location) {
            return (this.commentLocations[location.toString()] || []).slice();
        },

        // Returns all comments for this file ordered by iteration and line numbers
        getAllComments: function () {
            const commentArrays = this.getCommentLocations()
                .map(this.getCommentsAtLocation.bind(this));

            return Array.prototype.concat.apply([], commentArrays);
        },

        findComment: function (commentID) {
            for (let loc in this.commentLocations) {
                const comments = this.commentLocations[loc];
                const index = Util.findIndex(comments, function (c) { return c.id === commentID; });
                if (index >= 0) {
                    return {
                        location: CommentLocation(loc),
                        comment: comments[index],
                        index: index
                    };
                }
            }
            return null;
        },

        // Returns brief text summarizing this comment
        getCommentSummary: function (location) {
            const comments = this.getCommentsAtLocation(location);
            const summary = comments.length > 1 || !comments[0].note.trim() ? `${comments.length} comment(s)` : comments[0].note;
            return `${location.lineStart + 1}:${location.lineCount + 1} - ${summary}`;
        },

        getCommentSummaries: function () {
            return this.getCommentLocations().map(this.getCommentSummary.bind(this));
        },




        handleEvent: function (event) {
            const me = this;

            switch (event.type) {
                case 'addComment': {
                    if (event.data.path !== this.path.toLowerCase()) {
                        break;
                    }
                    const comment = Comment(
                        User(event.user),
                        event.data.code,
                        event.data.note,
                        event.id,
                        event.data.id
                    );

                    let commentArray = this.commentLocations[event.data.location];
                    if (!commentArray) {
                        this.commentLocations[event.data.location] = commentArray = [];
                    }
                    commentArray.push(comment);
                    commentArray.sort();
                    this.comments[comment.id] = comment;
                    break;
                }
                case 'editComment': {
                    const comment = this.comments[event.data.id];
                    if (comment) {
                        comment[event.data.edited] = event.data.value;
                    }
                    break;
                }
                case 'removeComment': {
                    const comment = this.comments[event.data.id];
                    if (!comment) {
                        break;
                    }

                    delete this.comments[event.data.id];

                    const locInfo = this.findComment(event.data.id);
                    const comments = me.commentLocations[locInfo.location];
                    if (comments.length > 1) {
                        comments.splice(locInfo.index, 1);
                    } else {
                        delete me.commentLocations[locInfo.location];
                    }
                    break;
                }
            }
        }
    };

    return function FileMeta(eventLog, displayPath) {
        const obj = Object.create(proto);

        obj.path = displayPath;
        obj.commentLocations = {};
        obj.comments = {};

        obj.eventLog = eventLog;
        obj.eventLog.subscribe(obj.handleEvent, obj);

        return obj;
    };
});
