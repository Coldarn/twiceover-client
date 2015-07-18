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
        },

        loadActiveEntry: function () {
            const path = (App.leftEntry || App.rightEntry).path,
                taskName = DiffWorkQueue.getTaskName(path, App.diffMode),
                task = workQueue.getTask(taskName);

            self.activeTaskName = taskName;

            if (task && task.diff) {
                const highlightBlocks = [LineHighlight()];
                
                self.codeEl.innerHTML = '<code class="line-highlights"></code>' + task.diff
                    .filter(function (part) {
                        return !((App.diffMode === 'left' && part.added) || (App.diffMode === 'right' && part.removed));
                    })
                    .map(function (part) {
                        const value = Util.escapeHtml(part.value);
                        let newlineCount = countLines(value);
                    
                        if (App.diffMode === 'char') {
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
                    }).join('').replace(/\n\n/g, '\n \n');
                
                self.highlightsEl = self.el.querySelector('.line-highlights');
                self.highlightsEl.innerHTML = highlightBlocks.join('');
                self.codeEl.setAttribute('class', 'code-block ' + path.substring(path.lastIndexOf('.') + 1));
                hljs.highlightBlock(self.codeEl);
            }
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