define([
    'App',
    'util/Util',
    'util/EventBus',
    'ui/Component',
    'ui/StatusWidget',
    'om/User'
], function (App, Util, EventBus, Component, StatusWidget, User) {
    'use strict';

    var me = {
        __proto__: Component.prototype,

        initComponent: function () {
            // me.emailControl = EmailEntry();
            // me.emailControl.prependTo(me.query('.review-status-right'));
            me.reviewStatusWidget = me.query('.review-status-widget');
            me.reviewerWidget = me.query('.reviewer-widget');
        },


        handleActiveReviewChanged: function () {
            const descriptionEl = me.query('#review-description-inplace')[0];
            descriptionEl.value = App.review.description;
            descriptionEl.readOnly = !App.user.is(App.review.owningUser);

            me.reviewStatusWidget.setHtml(null);
            StatusWidget(StatusWidget.IconSets.ReviewOwner, App.review.owningUser, App.review.status, null)
                .appendTo(me.reviewStatusWidget);

            me.reviewerWidget.setHtml(null);
            App.review.reviewers.forEach(function (reviewer) {
                const user = User(reviewer);
                if (!App.review.owningUser.is(user)) {
                    StatusWidget(StatusWidget.IconSets.Reviewer, user, 'active', null)
                        .appendTo(me.reviewerWidget);
                }
            });
        },

        handleActiveEntryChanged: function(path, leftEntry, rightEntry) {
            me.setVisible(!path);
        }
    };

    me.setEl(document.querySelector('.review-status'));

    EventBus.on('active_review_changed', me.handleActiveReviewChanged, me);
    EventBus.on('active_entry_changed', me.handleActiveEntryChanged, me);

    return me;
});
