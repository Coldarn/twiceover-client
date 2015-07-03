define([
    'util/Util',
    'util/Observable',
    'om/Review',
    'om/Iteration',
    'om/FileEntry'
], function (Util, Observable, Review, Iteration, FileEntry) {
    'use strict';
    
    var App = Observable();
    
    App.review = null,
    App.leftIteration = null,
    App.rightIteration = null,
    App.leftEntry = null,
    App.rightEntry = null,

    App.setReview = function (review) {
        App.review = review;
        App.fireEvent('reviewChanged', review);
    };
    
    return App;
});
