define([
    'util/Util',
    'util/EventBus',
    'util/EventLog',
    'util/ReviewStatus',
    'util/Remote',
    'om/Review',
    'om/Iteration',
    'om/FileEntry'
], function (Util, EventBus, EventLog, ReviewStatus, Remote, Review, Iteration, FileEntry) {
    'use strict';

    var App = {

        TEST_MODE: true,        // Provides pre-canned differences for quick testing

        user: null,             // Filled in on startup by querying the local system
        review: null,           // Active review
        leftIteration: null,    // Active left iteration
        rightIteration: null,   // Active right iteration
        leftEntry: null,        // Active left file entry being viewed
        rightEntry: null,       // Active right file entry being viewed
        fileMeta: null,         // Active FileMeta for the selected entrys

        diffMode: 'line',       // Current difference display setting

        status: null,           // Manages local persistence of review status UI state
        remote: null,           // Manages server communication of review state

        loadReview: function (logEvents) {
            const review = Review.load(EventLog.load(App.user, logEvents));

            review.eventLog.subscribe(handleReviewEvent);
            App.setActiveReview(review);
            App.setActiveIterations(0, review.iterations.length - 1);
        },

        setActiveReview: function (review) {
            App.review = review;
            App.status = ReviewStatus(review.id);
            App.remote.setReview(review);
            setTimeout(function () {
                EventBus.fire('active_review_changed', review);
            });
        },

        setActiveIterations: function (left, right) {
            const newLeft = App.review.getIteration(left);
            const newRight = App.review.getIteration(right);

            if (App.leftIteration === newLeft && App.rightIteration === newRight) {
                return;
            }

            App.leftIteration = newLeft;
            App.rightIteration = newRight;
            setTimeout(function () {
                EventBus.fire('active_iterations_changed', App.leftIteration, App.rightIteration);
            });

            const lastPath = (App.leftEntry && App.leftEntry.path) || (App.rightEntry && App.rightEntry.path);
            const availablePaths = App.getActiveEntryPaths();
            App.setActiveEntry(lastPath && availablePaths.indexOf(lastPath) >= 0 ? lastPath : availablePaths[0]);
        },

        setActiveEntry: function (displayPath) {
            if (displayPath) {
                const leftEntry = App.leftIteration.getEntry(displayPath),
                    rightEntry = App.rightIteration.getEntry(displayPath);

                if (!leftEntry && !rightEntry) {
                    throw new Error(`No entries found with the given path: ${displayPath}`);
                }
                App.leftEntry = leftEntry;
                App.rightEntry = rightEntry;
                App.fileMeta = App.review.getFileMeta(displayPath);
            }

            setTimeout(function () {
                EventBus.fire('active_entry_changed', displayPath, App.leftEntry, App.rightEntry);
            });
        },

        setDiffMode: function (mode) {
            if (['left', 'line', 'char', 'right'].indexOf(mode) < 0) {
                throw new Error(`Invalid diff mode: ${mode}`);
            }
            App.diffMode = mode;
            EventBus.fire('diff_mode_changed', mode);
        },

        getActiveEntryPaths: function () {
            // The files involved in any two given iterations is their union UNLESS THE LEFT ITERATION
            // IS THE BASE, in which case the right iteration's files are the full set.
            return App.leftIteration.index === 0
                ? App.rightIteration.getPaths()
                : Util.union(App.leftIteration.getPaths(), App.rightIteration.getPaths());
        },

        getActiveEntries: function () {
            return App.getActiveEntryPaths().map(function (path) {
                const left = App.leftIteration.getEntry(path);
                const right = App.rightIteration.getEntry(path);

                return {
                    path: (left || right).path,
                    left: left,
                    right: right
                }
            });
        },

        getEntryStatus: function (path) {
            const left = App.leftIteration.getEntry(path),
                right = App.rightIteration.getEntry(path);

            if (left && right) {
                if (left.content === right.content) {
                    return 'unchanged';
                } else {
                    return left.content === null ? 'added'
                        : right.content === null ? 'removed'
                        : 'changed';
                }
            } else if (left && !right) {
                if (App.leftIteration.index === 0) {
                    throw new Error('Extra base file included! How did you get here?!?');
                }
                return 'removed';
            } else if (!left && right) {
                if (App.leftIteration.index === 0) {
                    throw new Error('Base file missing! How did this happen?!?')
                }
                return 'added';
            } else {
                throw new Error('Both files missing! What have you done?!?')
            }
        }
    };

    function handleReviewEvent(event) {
        setTimeout(function () {
            switch (event.type) {
                case 'newIteration':
                    EventBus.fire('review_iteration_added', event);
                    break;
                case 'addComment':
                    EventBus.fire('review_comment_added', event);
                    break;
                case 'editComment':
                    EventBus.fire('review_comment_edited', event);
                    break;
                case 'removeComment':
                    EventBus.fire('review_comment_removed', event);
                    break;
            }
        });
    }

    return App;
});
