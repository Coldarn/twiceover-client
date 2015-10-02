define([
    'util/Util',
    'util/EventBus',
    'ui/util/ElementProxy',
    'ui/util/Component',
    'App',
    'om/CommentLocation'
], function (Util, EventBus, ElementProxy, Component, App, CommentLocation) {
    'use strict';

    const SCROLLBAR_RULES = [
        `.file-pane > content::after { right: 5px; }`,
        `.file-pane > content { border-right-width: 5px; border-right-style: solid; border-right-color: transparent; }`
    ];
    const DRAG_HANDLE_WIDTH = 7;

    var self = {
        __proto__: Component.prototype,

        scrollbarVisible: false,
        resizeDrag: false,

        initComponent: function () {
            self.listEl = self.query('content')
                .on('mousedown', self.handleResizeStart);

            window.addEventListener('mousemove', self.handleResizeMove);
            window.addEventListener('mouseup', self.handleResizeEnd);

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
            self.listEl.setHtml(`<ul class="file-list">
                <li class="file-entry title" title="${App.review.title}">${App.review.title}</li>
                ${fileHtml}
            </ul><div class="filler"> </div>`);

            self.queryAll('.file-entry').on('click', function () {
                App.setActiveEntry(this.classList.contains('title') ? null : this.dataset.path);
            });
            self.attachLinkHandlers();
            self.handleWindowResize();
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
                    App.setActiveIterations(location.leftIteration, location.rightIteration);
                    EventBus.fire('comment_link_clicked', path, location);
                }
            }, true);
        },



        handleActiveIterationsChanged: function() {
            self.populate();
        },

        handleActiveEntryChanged: function(path, leftEntry, rightEntry) {
            var selFileEl = document.querySelector(`.file-entry.selected`);
            if (selFileEl) {
                selFileEl.classList.remove('selected');
            }
            if (path) {
                self.query(`.file-entry[data-path="${path.toLowerCase()}"]`).setClass('selected', true);
            } else {
                self.query('.title').setClass('selected', true);
            }
        },

        handleCommentLinkClicked: function (path, location) {
            const fileEl = this.query(`.file-entry[data-path="${path}"]`);
            const linkEl = fileEl.query(`.comment-link[data-loc="${location}"]`);
            linkEl[0].classList.add('seen');
            App.status.setCommentSeen(path, location, true);
        },

        handleCommentAddedOrRemoved: function (event) {
            let path = event.data.path;
            if (!path) {
                const loc = App.review.findComment(event.data.id);
                if (loc) {
                    path = loc.fileMeta.path.toLowerCase();
                }
            }
            if (!path) {
                return;
            }

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
        },

        // Unfortunately, CSS doesn't allow us to position our scrollbar specially, so we have to do it manually.
        // This method tracks if the file list has a visible scrollbar so we can apply some style tweaks.
        handleWindowResize: function () {
            if (self.scrollbarVisible !== self.listEl[0].scrollHeight > self.listEl[0].offsetHeight) {
                self.scrollbarVisible = self.listEl[0].scrollHeight > self.listEl[0].offsetHeight;

                const sheet = document.styleSheets[document.styleSheets.length - 1];
                if (self.scrollbarVisible) {
                    self.scrollbarRuleIndex = sheet.cssRules.length;
                    SCROLLBAR_RULES.forEach(function (rule) {
                        sheet.insertRule(rule, sheet.rules.length);
                    });
                } else {
                    SCROLLBAR_RULES.forEach(function (rule) {
                        const index = Array.prototype.findIndex.call(sheet.rules, function (r) {
                            return r.cssText === rule;
                        });
                        sheet.deleteRule(index);
                    });
                }
            }
        },

        handleResizeStart: function (e) {
            const bounds = self.listEl[0].getBoundingClientRect();
            const x = e.x + (self.scrollbarVisible ? 11 : 0);
            if (x >= bounds.width - DRAG_HANDLE_WIDTH && x < bounds.width) {
                self.resizeDrag = true;
            }
        },

        handleResizeMove: function (e) {
            if (self.resizeDrag) {
                self.el.style.width = self.el.getBoundingClientRect().width + e.movementX + 'px';
            }
        },

        handleResizeEnd: function (e) {
            self.resizeDrag = false;
        }
    };

    EventBus.on('active_iterations_changed', self.handleActiveIterationsChanged, self);
    EventBus.on('active_entry_changed', self.handleActiveEntryChanged, self);
    EventBus.on('comment_link_clicked', self.handleCommentLinkClicked, self);
    EventBus.on('review_comment_added', self.handleCommentAddedOrRemoved, self);
    EventBus.on('review_comment_removed', self.handleCommentAddedOrRemoved, self);
    EventBus.on('review_comment_edited', self.handleCommentAddedOrRemoved, self);
    EventBus.on('diff_mode_changed', self.handleDiffModeChanged, self);

    window.addEventListener('resize', self.handleWindowResize);

    self.setEl(document.querySelector('.file-pane'));

    return self;
});
