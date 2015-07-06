define([
    'util/Util',
    'util/Observable',
    'om/Review',
    'om/Iteration',
    'om/FileEntry'
], function (Util, Observable, Review, Iteration, FileEntry) {
    'use strict';
    
    var App = Observable();
    
    App.TEST_MODE = true;
    
    App.review = null,
    App.leftIteration = null,
    App.rightIteration = null,
    App.leftEntry = null,
    App.rightEntry = null,

    App.setActiveReview = function (review) {
        App.review = review;
        App.fireEvent('activeReviewChanged', review);
    };

    App.setActiveIterations = function (left, right) {
        App.leftIteration = App.review.getIteration(left);
        App.rightIteration = App.review.getIteration(right);
        App.fireEvent('activeIterationsChanged', App.leftIteration, App.rightIteration);
    };
    
    App.setActiveEntry = function (displayPath) {
        var leftEntry = App.leftIteration.getEntry(displayPath),
            rightEntry = App.rightIteration.getEntry(displayPath);
        
        if (!leftEntry && !rightEntry) {
            throw new Error(`No entries found with the given path: ${displayPath}`);
        }
        App.leftEntry = leftEntry;
        App.rightEntry = rightEntry;
        
        App.fireEvent('activeEntryChanged', displayPath, App.leftEntry, App.rightEntry);
    };
    
    return App;
});
