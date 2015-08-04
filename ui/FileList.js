define([
    'util/Util',
    'util/EventBus',
    'ui/Component',
    'App'
], function (Util, EventBus, Component, App) {
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
                    const diffStatus = App.getEntryStatus(path);
                    const commentSummaries = App.review.getFileMeta(path).getCommentSummaries();
                    const innerHtml = commentSummaries.length > 0 ? `<ul><li>${commentSummaries.join('</li><li>')}</li></ul>` : '';
                    return `<li class="file-entry ${diffStatus}" title="${path}" data-path="${path}">${name}${innerHtml}</li>`;
                }).join('');
            self.listEl.innerHTML = `<ul class="file-list">${fileHtml}</ul><div class="filler"> </div>`;

            self.queryAll('.file-entry').on('click', function () {
                App.setActiveEntry(this.dataset.path);
            });
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
        
        handleDiffModeChanged: function (diffMode) {
            self.queryAll('footer > button').forEach(function (el) {
                el.classList.toggle('selected', el.dataset.diffmode === diffMode);
            });
        }
    };
    
    EventBus.on('active_review_changed', self.handleActiveReviewChanged, self);
    EventBus.on('active_iterations_changed', self.handleActiveIterationsChanged, self);
    EventBus.on('active_entry_changed', self.handleActiveEntryChanged, self);
    EventBus.on('diff_mode_changed', self.handleDiffModeChanged, self);
    
    self.setEl(document.querySelector('.file-pane'));
    
    return self;
});