define([
    'util/Util',
    'util/EventBus',
    'om/Review',
    'om/Iteration',
    'om/FileEntry'
], function (Util, EventBus, Review, Iteration, FileEntry) {
    'use strict';
    
    var App = {
    
        TEST_MODE: true,

        review: null,
        leftIteration: null,
        rightIteration: null,
        leftEntry: null,
        rightEntry: null,
        
        diffMode: 'line',

        setActiveReview: function (review) {
            App.review = review;
            EventBus.fire('active_review_changed', review);
        },

        setActiveIterations: function (left, right) {
            const newLeft = App.review.getIteration(left);
            const newRight = App.review.getIteration(right);
            
            if (App.leftIteration === newLeft && App.rightIteration === newRight) {
                return;
            }
            
            App.leftIteration = newLeft;
            App.rightIteration = newRight;
            EventBus.fire('active_iterations_changed', App.leftIteration, App.rightIteration);

            const lastPath = (App.leftEntry && App.leftEntry.path) || (App.rightEntry && App.rightEntry.path);
            const availablePaths = App.getActiveEntryPaths();
            App.setActiveEntry(lastPath && availablePaths.indexOf(lastPath) >= 0 ? lastPath : availablePaths[0]);
        },

        setActiveEntry: function (displayPath) {
            var leftEntry = App.leftIteration.getEntry(displayPath),
                rightEntry = App.rightIteration.getEntry(displayPath);

            if (!leftEntry && !rightEntry) {
                throw new Error(`No entries found with the given path: ${displayPath}`);
            }
            App.leftEntry = leftEntry;
            App.rightEntry = rightEntry;

            EventBus.fire('active_entry_changed', displayPath, App.leftEntry, App.rightEntry);
        },
        
        setDiffMode: function (mode) {
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
                return {
                    path: path,
                    left: App.leftIteration.getEntry(path),
                    right: App.rightIteration.getEntry(path)
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
    
    return App;
});
