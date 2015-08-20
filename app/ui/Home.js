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
                const myReviewsEl = me.query('#myReviews').setHtml(myReviews.map(function (review) {
                    return `<div class="review-link status-${review.status}" data-review-index="${review.ix}">
                        ${Util.escapeHtml(review.title)}
                        <span class="review-time">${moment(review.created).calendar()}<span>
                    </div>`;
                }).join(''));
                myReviewsEl.queryAll('.review-link').on('click', me.handleReviewClick.bind(me));
            }, function (err) {
            });
        },
        
        

        handleReviewClick: function (event) {
            App.remote.loadReview(Number(event.target.dataset.reviewIndex));
            this.destroy();
        },
        
        handleNewReviewClick: function () {
            ImportDialog().appendTo(document.body).whenLoaded(function (comp) { comp.show(); });
        }
    };
    
    return function Home() {
        const obj = Object.create(proto);
        obj.setHtml('text!partials/Home.html');
        return obj;
    };
});