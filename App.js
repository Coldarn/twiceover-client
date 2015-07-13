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
            App.leftIteration = App.review.getIteration(left);
            App.rightIteration = App.review.getIteration(right);
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
            return Util.union(App.leftIteration.getPaths(), App.rightIteration.getPaths());
        },
        
        getActiveEntries: function () {
            return App.getActiveEntryPaths().map(function (path) {
                return {
                    left: App.leftIteration.getEntry(path),
                    right: App.rightIteration.getEntry(path)
                }
            });
        }
    };
    
    return App;
});
