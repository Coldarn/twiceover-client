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
        
        selection: null,        // Active code block selection
        activeComment: null,    // Currently-active comment component
        
        
        initComponent: function () {
            self.codeEl = self.el.querySelector('.code-block');
            self.addCommentEl = self.el.querySelector('header > button');
            self.headerTextEl = self.el.querySelector('header > .filler');
            
            self.on('mouseup', self.handleMouseUp);

            self.addCommentEl.addEventListener('click', self.handleAddComment);
        },

        loadActiveEntry: function () {
            const path = (App.leftEntry || App.rightEntry).path,
                taskName = DiffWorkQueue.getTaskName(path, App.diffMode),
                task = workQueue.getTask(taskName);

            self.activeTaskName = taskName;
            self.headerTextEl.innerText = path;

            if (task && task.diff) {
                const highlightBlocks = [LineHighlight()],
                    diffBlocks = ['<div>\n</div>'],
                    highlightLines = App.diffMode === 'char';
                
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
                        if (highlightLines) {
                            if (part.added || part.removed) {
                                const lastHighlight = highlightBlocks[highlightBlocks.length - 1];
                                lastHighlight.set(part.added, part.removed);
                            }
                            for (; newlineCount > 0; newlineCount -= 1) {
                                highlightBlocks.push(LineHighlight(part.added && newlineCount > 1, part.removed && newlineCount > 1));
                            }
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
                
                // Setup the inner, background element's HTML (used for line highlights in 'char' diff mode)
                self.highlights = Component(`<code class="lines highlights">${highlightBlocks.join('')}</code>`);
                self.codeEl.insertBefore(self.highlights.el, self.codeEl.firstChild);
                
                self.diffs.el.style.minWidth = (self.codeEl.lastChild.offsetWidth + 2) + 'px';
                self.highlights.el.style.minWidth = (self.codeEl.lastChild.offsetWidth + 2) + 'px';
            }
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
            self.diffs.lineBorders.queryAll('div').setAttribute('class', null);
            self.addCommentEl.style.display = 'none';
            self.setSelection(null);
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
            lineBorderEl.children[startLine].classList.add('diff-start');
            for (let i = startLine + lineCount; i >= startLine; i--) {
                lineBorderEl.children[i].classList.add('diff-side');
            }
            lineBorderEl.children[startLine + lineCount].classList.add('diff-end');
            self.addCommentEl.style.display = null;

            // Create a range encapsulating just the code text so we can extract matching lines
            const allCodeRange = new Range();
            allCodeRange.selectNodeContents(self.codeEl);
            allCodeRange.setStartAfter(self.diffs.el);
            
            const topOffset = lineBorderEl.children[startLine].getBoundingClientRect().top -
                self.diffs.el.getBoundingClientRect().top;
            const code = allCodeRange.toString().split('\n').slice(startLine, startLine + lineCount + 1).join('\n');
            self.setSelection({
                topOffset: topOffset,
                location: commentLoc,
                comment: Comment(App.user, code),
            });
        },
        
        handleAddComment: function () {
            if (!self.selection) {
                return;
            }
            
            const selection = self.selection;
            self.clearSelection();
            
            self.activeComment = CodeComment(selection.topOffset, selection.location, selection.comment);
            self.activeComment.appendTo(self.diffs);
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
        }
    };

    EventBus.on('active_entry_changed', self.handleActiveEntryChanged, self);
    EventBus.on('diff_mode_changed', self.handleDiffModeChanged, self);
    EventBus.on('active_iterations_changed', self.handleIterationsChanged, self);
    EventBus.on('diff_completed', self.handleDiffCompleted, self);
    
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