define([
    'App',
    'util/Util',
    'util/Request',
    'ui/Component',
    'ui/ImportDialog',
    'om/User'
], function (App, Util, Request, Component, ImportDialog, User) {
    'use strict';

    var proto = {
        __proto__: Component.prototype,

        initComponent: function () {
            var me = this;
            
            me.query('footer > .close').setVisible(me.canClose).on('click', me.handleCloseClick.bind(me));
            me.query('#newReviewButton').on('click', me.handleNewReviewClick.bind(me));
            
            Request.get(`http://${App.serverUrl}/api/user/${App.user.email}`).then(function (reviews) {
                const myReviews = [];
                const reviewRequests = [];
                reviews.forEach(function (review) {
                    if (User.parse(review.owner).is(App.user)) {
                        myReviews.push(review);
                    } else {
                        reviewRequests.push(review);
                    }
                });
                me.query('#myReviews').setHtml(me.buildReviewList(myReviews));
                me.query('#reviewRequests').setHtml(me.buildReviewList(reviewRequests));
                
                me.queryAll('.review-link').on('click', me.handleReviewClick.bind(me), true);
            }, function (err) {
                me.query('#myReviews').setHtml('<div class="error">Failed to load</div>');
            });
        },
        
        buildReviewList: function (reviews) {
            return reviews.map(function (review) {
                return `<div class="review-link status-${review.status}" data-review-index="${review.ix}">
                    <span>${Util.escapeHtml(review.title)}</span>
                    <span class="review-time">${moment(review.created).calendar()}<span>
                </div>`;
            }).join('');
        },
        
        

        handleCloseClick: function (event) {
            this.destroy();
        },
        
        handleReviewClick: function (event) {
            App.remote.loadReview(Number(event.currentTarget.dataset.reviewIndex));
            this.destroy();
        },
        
        handleNewReviewClick: function () {
            ImportDialog().appendTo(document.body).whenLoaded(function (comp) { comp.show(); });
        }
    };
    
    return function Home(canClose) {
        const obj = Object.create(proto);
        obj.canClose = canClose;
        obj.setHtml('text!partials/Home.html');
        return obj;
    };
});