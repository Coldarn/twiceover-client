define([
    'util/Util',
    'util/EventBus',
    'util/DiffWorkQueue',
    'ui/Component',
    'ui/CodeComment',
    'om/CommentLocation',
    'om/Comment',
    'App'
], function (Util, EventBus, DiffWorkQueue, Component, CodeComment, CommentLocation, Comment, App) {
    'use strict';

    const workQueue = DiffWorkQueue();

    const self = {
        __proto__: Component.prototype,


        codeEl: null,           // Root level <code> element hosting the code view
        addCommentEl: null,     // "Add Comment" button element
        headerTextEl: null,     // Element containing the file path text

        diffs: null,            // Component containing foreground elements to display diffs and selections
        highlights: null,       // Component containing background line highlights to help draw attention to diffs
        comments: null,         // Component containing foreground comment boxes for user selection

        selection: null,        // Active code block selection
        activeComment: null,    // Currently-active comment component
        postLoadActions: [],    // Array of actions to run after the next loadActiveEntry
        highlightBlocks: [],    // Array of objects tracking lines with adds and removes


        initComponent: function () {
            self.codeEl = self.el.querySelector('.code-block');
            self.addCommentEl = self.query('header > button');
            self.headerTextEl = self.el.querySelector('header > .filler');

            self.scrollIndicatorRemoved = self.query('.scroll-indicators > .removed');
            self.scrollIndicatorAdded = self.query('.scroll-indicators > .added');

            self.on('mouseup', self.handleMouseUp);
            self.addCommentEl.on('click', self.handleAddComment);
            window.addEventListener('resize', self.refreshScrollIndicators);
        },

        loadActiveEntry: function () {
            const path = (App.leftEntry || App.rightEntry).path,
                taskName = DiffWorkQueue.getTaskName(path, App.diffMode),
                task = workQueue.getTask(taskName);

            self.activeTaskName = taskName;
            self.headerTextEl.innerText = path;

            if (!task || !task.diff) {
                return;
            }

            const highlightBlocks = [LineHighlight()];
            const diffBlocks = ['<div>\n</div>'];

            const codeHtml = task.diff
                .filter(function (part) {
                    return !((App.diffMode === 'left' && part.added) || (App.diffMode === 'right' && part.removed));
                })
                .map(function (part) {
                    const value = Util.escapeHtml(part.value);
                    let newlineCount = Util.countLines(value);

                    // Inserts a div for each line into the diffs element
                    if (newlineCount) {
                        diffBlocks.push('<div>\n</div>'.repeat(newlineCount));
                    }

                    // Inserts an object into our highlights array to highlight lines with diffs
                    if (part.added || part.removed) {
                        const lastHighlight = highlightBlocks[highlightBlocks.length - 1];
                        lastHighlight.set(part.added, part.removed);
                    }
                    for (; newlineCount > 0; newlineCount -= 1) {
                        highlightBlocks.push(LineHighlight(part.added && newlineCount > 1, part.removed && newlineCount > 1));
                    }

                    return part.added ? `<span class="diff-added">${value}</span>`
                        : part.removed ? `<span class="diff-removed">${value}</span>`
                        : value;
                }).join('');

            // Set our root code element HTML
            self.codeEl.innerHTML = `<span>${codeHtml}</span>`;
            self.codeEl.setAttribute('class', 'code-block ' + path.substring(path.lastIndexOf('.') + 1));

            hljs.highlightBlock(self.codeEl);

            // Setup the inner, foreground element's HTML (used for diff blocks and interation)
            self.diffs = Component(`<code class="lines diffs"><div class="line-borders">${diffBlocks.join('')}</div></code>`);
            self.diffs.lineBorders = self.diffs.query('.line-borders');
            self.codeEl.insertBefore(self.diffs.el, self.codeEl.firstChild);

            // Setup the inner, foregorund comment region HTML (used for outlining comment blocks)
            self.comments = Component(`<code class="lines comments">${diffBlocks.join('')}</code>`);
            self.codeEl.insertBefore(self.comments.el, self.codeEl.firstChild);

            // Setup the inner, background element's HTML (used for line highlights in 'char' diff mode)
            self.highlights = Component(`<code class="lines highlights">${highlightBlocks.join('')}</code>`);
            self.codeEl.insertBefore(self.highlights.el, self.codeEl.firstChild);

            const contentWidth = (self.codeEl.lastChild.offsetWidth + 2) + 'px';
            self.highlights.el.style.minWidth = contentWidth;
            self.diffs.el.style.minWidth = contentWidth;
            self.comments.el.style.minWidth = contentWidth;

            self.highlightBlocks = highlightBlocks;

            self.refreshCommentRegions();
            self.refreshScrollIndicators();

            self.postLoadActions.forEach(function (action) {
                action();
            });
            self.postLoadActions = [];
        },

        refreshCommentRegions: function () {
            if (!self.comments) {
                return;
            }
            self.comments.queryAll('div').attr('class', null);
            App.fileMeta.getCommentLocations()
                .filter(function (loc) {
                    return loc.diffMode === App.diffMode
                        && App.leftIteration.index === loc.leftIteration
                        && App.rightIteration.index === loc.rightIteration;
                })
                .map(function (location) {
                    self.refreshBorders(self.comments.el, location.lineStart, location.lineCount,
                        self.showComment.bind(self, location));
                });
        },

        refreshBorders: function (parentEl, startLine, lineCount, clickFn) {
            parentEl.children[startLine].classList.add('diff-start');
            for (let i = startLine + lineCount; i >= startLine; i--) {
                const rowEl = parentEl.children[i];
                rowEl.classList.add('diff-side');
                if (clickFn) {
                    rowEl.classList.add('clickable');
                    rowEl.onclick = clickFn;    // Only keep the most recent handler
                }
            }
            parentEl.children[startLine + lineCount].classList.add('diff-end');
        },

        refreshScrollIndicators: function () {
            const lineHeight = self.codeEl.lastChild.offsetHeight / self.highlightBlocks.length;
            const scaleHeight = Math.min(1, self.codeEl.offsetHeight / self.codeEl.scrollHeight);
            self.scrollIndicatorRemoved.setHtml(self.highlightBlocks.map(function (b, i) {
                    return !b.removed ? '' : `<rect x="0" y="${i}" width="1" height="1" />`;
                }).join(''))
                .attr('transform', `scale(3,${scaleHeight * lineHeight})`);
            self.scrollIndicatorAdded.setHtml(self.highlightBlocks.map(function (b, i) {
                    return !b.added ? '' : `<rect x="0" y="${i}" width="1" height="1" />`;
                }).join(''))
                .attr('transform', `translate(9,0)scale(3,${scaleHeight * lineHeight})`);
        },

        getLineTopOffset: function (lineIndex) {
            return self.diffs.lineBorders[0].children[lineIndex].getBoundingClientRect().top -
                self.diffs.el.getBoundingClientRect().top;
        },

        getCode: function (startLine, lineCount) {
            const allCodeRange = new Range();
            allCodeRange.selectNodeContents(self.codeEl);
            allCodeRange.setStartAfter(self.diffs.el);
            return allCodeRange.toString().split('\n').slice(startLine, startLine + lineCount + 1).join('\n');
        },

        setSelection: function (selection) {
            if (self.activeComment) {
                self.activeComment.close();
                self.activeComment = null;
            }
            if (selection) {
                self.selection = selection;
            }
        },

        clearSelection: function () {
            self.diffs.lineBorders.queryAll('div').attr('class', null);
            self.addCommentEl.setVisible(false);
            self.setSelection(null);
        },

        showComment: function (location) {
            self.setSelection({
                topOffset: self.getLineTopOffset(location.lineStart) - 1,
                location: location,
                code: self.getCode(location.lineStart, location.lineCount),
            });
            self.handleAddComment();
        },

        isTargetInternal: function (event) {
            return self.codeEl.contains(event.target) && !self.diffs.el.contains(event.target);
        },

        isSelectionInsideComment: function (selRange) {
            return self.diffs.el.contains(selRange.startContainer) || self.diffs.el.contains(selRange.endContainer);
        },




        handleMouseUp: function (event) {
            var selection = window.getSelection(),
                selRange = selection.isCollapsed ? null : selection.getRangeAt(0);

            if (!self.isTargetInternal(event) || (selRange && self.isSelectionInsideComment(selRange))) {
                return;
            }

            if (!selRange || !self.codeEl.contains(selRange.commonAncestorContainer)) {
                self.clearSelection();
                return;
            }

            const beforeRange = new Range();
            beforeRange.setStartAfter(self.diffs.el);
            beforeRange.setEnd(selRange.startContainer, selRange.startOffset);

            const startLine = Util.countLines(beforeRange.toString());
            const lineCount = Util.countLines(selRange.toString());
            const commentLoc = CommentLocation(App.leftIteration.index, App.rightIteration.index, App.diffMode, startLine, lineCount);

            // If the selection hasn't changed, abort now
            if (self.selection && self.selection.location.is(commentLoc)) {
                return;
            }
            self.clearSelection();

            const lineBorderEl = self.diffs.lineBorders[0];
            self.refreshBorders(lineBorderEl, startLine, lineCount);
            self.addCommentEl.setVisible(true);

            // Create a range encapsulating just the code text so we can extract matching lines
            self.setSelection({
                topOffset: self.getLineTopOffset(startLine),
                location: commentLoc,
                code: self.getCode(startLine, lineCount),
            });
        },

        handleAddComment: function () {
            if (!self.selection) {
                return;
            }

            const selection = self.selection;
            self.clearSelection();

            self.activeComment = CodeComment(selection.topOffset, App.fileMeta, selection.location, selection.code);
            self.activeComment.appendTo(self.diffs);
            self.activeComment.whenLoaded(function (comp) {
                comp.el.scrollIntoViewIfNeeded();
            });
        },

        handleActiveEntryChanged: function(path, leftEntry, rightEntry) {
            self.loadActiveEntry();
        },

        handleDiffModeChanged: function (diffMode) {
            self.loadActiveEntry();
        },

        handleIterationsChanged: function () {
            workQueue.cancelAll();
            App.getActiveEntries().forEach(function (pair) {
                const path = (pair.left || pair.right).path;
                const leftContent = pair.left && pair.left.content || '';
                const rightContent = pair.right && pair.right.content || '';

                workQueue.addTask(path, 'line', leftContent, rightContent);
                workQueue.addTask(path, 'char', leftContent, rightContent);
            });
        },

        handleDiffCompleted: function (path, diffMode) {
            if (DiffWorkQueue.getTaskName(path, diffMode) === self.activeTaskName) {
                self.loadActiveEntry();
            }
        },

        handleCommentAddedOrRemoved: function (event) {
            if (App.fileMeta === App.review.getFileMeta(event.data.path)) {
                self.refreshCommentRegions();
            }
        },

        handleCommentLinkClicked: function (path, location) {
            self.postLoadActions.push(function () {
                self.showComment(location);
            });
        }
    };

    EventBus.on('active_entry_changed', self.handleActiveEntryChanged, self);
    EventBus.on('diff_mode_changed', self.handleDiffModeChanged, self);
    EventBus.on('active_iterations_changed', self.handleIterationsChanged, self);
    EventBus.on('diff_completed', self.handleDiffCompleted, self);
    EventBus.on('review_comment_added', self.handleCommentAddedOrRemoved, self);
    EventBus.on('review_comment_removed', self.handleCommentAddedOrRemoved, self);
    EventBus.on('comment_link_clicked', self.handleCommentLinkClicked, self);

    self.setEl(document.querySelector('.code-pane'));



    const LineHighlight = (function () {
        const proto = {
            set: function (added, removed) {
                this.added = added || this.added;
                this.removed = removed || this.removed;
            },
            toString: function () {
                if (this.added || this.removed) {
                    return `<div class="code-line ${this.added ? 'added' : ''} ${this.removed ? 'removed' : ''}">\n</div>`;
                }
                return '\n';
            }
        };

        return function LineHighlight(added, removed) {
            const obj = Object.create(proto);
            obj.set(added, removed);
            return obj;
        };
    }());


    return self;
});
