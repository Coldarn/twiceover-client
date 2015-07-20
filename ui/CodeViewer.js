define([
    'util/Util',
    'util/EventBus',
    'util/DiffWorkQueue',
    'ui/Component',
    'App'
], function (Util, EventBus, DiffWorkQueue, Component, App) {
    'use strict';
    
    const workQueue = DiffWorkQueue();
    
    const self = {
        __proto__: Component.prototype,
        
        initComponent: function () {
            self.codeEl = self.el.querySelector('.code-block');
            self.el.addEventListener('mouseup', self.handleMouseUp);
        },

        loadActiveEntry: function () {
            const path = (App.leftEntry || App.rightEntry).path,
                taskName = DiffWorkQueue.getTaskName(path, App.diffMode),
                task = workQueue.getTask(taskName);

            self.activeTaskName = taskName;

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
                        let newlineCount = countLines(value);
                    
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
                self.codeEl.innerHTML = codeHtml;
                self.codeEl.setAttribute('class', 'code-block ' + path.substring(path.lastIndexOf('.') + 1));
                
                hljs.highlightBlock(self.codeEl);
                
                // Setup the inner, foreground element's HTML (used for diff blocks and interation)
                self.diffs = Component('<code class="lines diffs"></code>');
                self.codeEl.insertBefore(self.diffs.el, self.codeEl.firstChild);
                self.diffs.el.innerHTML = diffBlocks.join('');
                
                // Setup the inner, background element's HTML (used for line highlights in 'char' diff mode)
                self.highlights = Component('<code class="lines highlights"></code>');
                self.codeEl.insertBefore(self.highlights.el, self.codeEl.firstChild);
                self.highlights.el.innerHTML = highlightBlocks.join('');
            }
        },
        
        handleMouseUp: function (event) {
            var selection = window.getSelection(),
                selRange = selection.isCollapsed ? null : selection.getRangeAt(0);
            
            if (!selRange) {
                return;
            }
            
            const beforeRange = new Range();
            beforeRange.setStartAfter(self.diffs.el);
            beforeRange.setEnd(selRange.startContainer, selRange.startOffset);
            
            const startLine = beforeRange.toString().split('\n').length - 1;
            const lineCount = selRange.toString().split('\n').length - 1;
            
            self.diffs.queryAll('div').setAttribute('class', null);
            self.diffs.el.children[startLine].classList.add('diff-start');
            for (let i = startLine + lineCount; i >= startLine; i--) {
                self.diffs.el.children[i].classList.add('diff-side');
            }
            self.diffs.el.children[startLine + lineCount].classList.add('diff-end');
//            console.log(self.codeEl.innerText.split('\n').slice(startLine, startLine + lineCount).join('\n'));
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
    
    
    
    function countLines(str) {
        let count = -1,
            lastIndex = -1;
        do {
            count += 1
            lastIndex = str.indexOf('\n', lastIndex + 1);
        } while (lastIndex >= 0);
        return count;
    }
    
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