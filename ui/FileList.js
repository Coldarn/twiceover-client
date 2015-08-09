define([
    'util/Util',
    'util/EventBus',
    'util/ElementProxy',
    'ui/Component',
    'App',
    'om/CommentLocation'
], function (Util, EventBus, ElementProxy, Component, App, CommentLocation) {
    'use strict';

    var self = {
        __proto__: Component.prototype,

        initComponent: function () {
            self.listEl = self.el.querySelector('content');
            self.queryAll('footer > button').on('mousedown', function () {
                App.setDiffMode(this.innerText);
            });
            self.handleDiffModeChanged(App.diffMode);
        },

        populate: function () {
            var paths = App.getActiveEntryPaths(),
                fileHtml = paths.map(function (path) {
                    return `<li class="file-entry ${App.getEntryStatus(path)}" title="${path}" data-path="${path.toLowerCase()}">
                        ${self.buildEntryHtml(path)}
                    </li>`;
                }).join('');
            self.listEl.innerHTML = `<ul class="file-list">${fileHtml}</ul><div class="filler"> </div>`;

            self.queryAll('.file-entry').on('click', function () {
                App.setActiveEntry(this.dataset.path);
            });
            self.attachLinkHandlers();
        },
        
        buildEntryHtml: function (path) {
            // Convert path to the canonical, properly-capitalized form
            path = App.review.getFileMeta(path).path;
            
            const splitPath = path.split('/');
            const name = splitPath[splitPath.length - 1];
            const fileMeta = App.review.getFileMeta(path);
            const commentLocations = fileMeta.getCommentLocations();
            const innerHtml = commentLocations.length > 0 ? `<ul>${commentLocations.map(function (l) {
                const seen = App.status.isCommentSeen(fileMeta.path, l) ? 'seen' : '';
                return `<li class="comment-link ${seen}" data-loc="${l}"><div>${fileMeta.getCommentSummary(l)}</div></li>`;
            }).join('')}</ul>` : '';
            return `<div>${name}</div>${innerHtml}`;
        },
        
        attachLinkHandlers: function (el) {
            (el || self).queryAll('.comment-link').on('click', function (event) {
                const path = this.parentNode.parentNode.dataset.path;
                if (this.classList.contains('seen') && event.x <= this.getBoundingClientRect().left + 25) {
                    this.classList.remove('seen');
                    App.status.setCommentSeen(path, this.dataset.loc, false);
                } else {
                    const location = CommentLocation(this.dataset.loc);
                    App.setDiffMode(location.diffMode);
                    EventBus.fire('comment_link_clicked', path, location);
                }
            }, true);
        },



        handleActiveReviewChanged: function (review) {
            self.query('header')[0].innerText = review.title;
        },

        handleActiveIterationsChanged: function() {
            self.populate();
        },

        handleActiveEntryChanged: function(path, leftEntry, rightEntry) {
            var selFileEl = document.querySelector(`.file-entry.selected`);
            if (selFileEl) {
                selFileEl.classList.remove('selected');
            }
            document.querySelector(`.file-entry[data-path="${path.toLowerCase()}"]`).classList.add('selected');
        },

        handleCommentLinkClicked: function (path, location) {
            const fileEl = this.query(`.file-entry[data-path="${path}"]`);
            const linkEl = fileEl.query(`.comment-link[data-loc="${location}"]`);
            linkEl[0].classList.add('seen');
            App.status.setCommentSeen(path, location, true);
        },
        
        handleCommentAddedOrRemoved: function (event) {
            const path = event.data.path || App.review.findComment(event.data.id).fileMeta.path.toLowerCase();
            const entryEl = self.query(`.file-entry[data-path="${path}"]`)[0];
            if (!entryEl) {
                return;
            }
            entryEl.innerHTML = self.buildEntryHtml(path);
            self.attachLinkHandlers(ElementProxy(entryEl));
        },

        handleDiffModeChanged: function (diffMode) {
            self.queryAll('footer > button').forEach(function (el) {
                el.classList.toggle('selected', el.dataset.diffmode === diffMode);
            });
        }
    };

    EventBus.on('active_review_changed', self.handleActiveReviewChanged, self);
    EventBus.on('active_iterations_changed', self.handleActiveIterationsChanged, self);
    EventBus.on('active_entry_changed', self.handleActiveEntryChanged, self);
    EventBus.on('comment_link_clicked', self.handleCommentLinkClicked, self);
    EventBus.on('review_comment_added', self.handleCommentAddedOrRemoved, self);
    EventBus.on('review_comment_removed', self.handleCommentAddedOrRemoved, self);
    EventBus.on('review_comment_edited', self.handleCommentAddedOrRemoved, self);
    EventBus.on('diff_mode_changed', self.handleDiffModeChanged, self);

    self.setEl(document.querySelector('.file-pane'));

    return self;
});
