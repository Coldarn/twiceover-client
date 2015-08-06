define([
    'util/Util',
    'util/EventBus',
    'ui/Component',
    'App',
    'om/CommentLocation'
], function (Util, EventBus, Component, App, CommentLocation) {
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
                    const splitPath = path.split('/');
                    const name = splitPath[splitPath.length - 1];
                    const fileMeta = App.review.getFileMeta(path);
                    const commentLocations = fileMeta.getCommentLocations();
                    const innerHtml = commentLocations.length > 0 ? `<ul>${commentLocations.map(function (l) {
                        return `<li class="comment-link" data-loc="${l}"><div>${fileMeta.getCommentSummary(l)}</div></li>`;
                    }).join('')}</ul>` : '';
                    return `<li class="file-entry ${App.getEntryStatus(path)}" title="${path}" data-path="${path}"><div>${name}</div>${innerHtml}</li>`;
                }).join('');
            self.listEl.innerHTML = `<ul class="file-list">${fileHtml}</ul><div class="filler"> </div>`;

            self.queryAll('.file-entry').on('click', function () {
                App.setActiveEntry(this.dataset.path);
            });
            self.queryAll('.comment-link').on('click', function (event) {
                if (this.classList.contains('seen') && event.x <= this.getBoundingClientRect().left + 25) {
                    this.classList.remove('seen');
                } else {
                    EventBus.fire('comment_link_clicked', CommentLocation(this.dataset.loc));
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
            document.querySelector(`.file-entry[data-path="${path}"]`).classList.add('selected');
        },

        handleCommentLinkClicked: function (commentLocation) {
            const linkEl = self.query(`.comment-link[data-loc="${commentLocation}"]`);
            linkEl[0].classList.add('seen');
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
    EventBus.on('diff_mode_changed', self.handleDiffModeChanged, self);

    self.setEl(document.querySelector('.file-pane'));

    return self;
});
