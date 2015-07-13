define([
    'util/Util',
    'util/EventBus',
    'ui/Component',
    'App'
], function (Util, EventBus, Component, App) {
    'use strict';
    
    function getTaskName(path, diffMode) {
        return `${path}+${diffMode === 'char' ? 'char' : 'line'}`;
    }
    
    function DiffTask(path, diffMode, leftContent, rightContent) {
        return {
            name: getTaskName(path, diffMode),
            path: path,
            diffMode: diffMode,
            leftContent: leftContent,
            rightContent: rightContent,
            diff: null                  // Filled in when the background task completes
        };
    }
    
    function WorkQueue() {
        const self = {
            workers: [],
            tasks: {},
            queue: [],
            
            addTask: function (task) {
                if (self.tasks[task.name]) {
                    throw new Error("Task already enqueued!");
                }
                self.tasks[task.name] = task;
                self.queue.push(task.name);
                
                if (self.workers.length < 4) {
                    const worker = new Worker('util/BackgroundDiffer.js');
                    worker.onmessage = self.handleWorkerMessage.bind(self, worker);
                    self.workers.push(worker);
                    self.sendWork(worker);
                }
            },
            
            getTask: function (name) {
                return self.tasks[name];
            },
            
            moveToFront: function (name) {
                const index = self.queue.indexOf(name);
                if (index >= 0) {
                    self.queue.splice(index, 1);
                    self.queue.unshift(name);
                }
            },
            
            handleWorkerMessage: function (worker, message) {
                const task = self.tasks[message.data.name];
                if (task) {
                    task.diff = message.data.diff;
                    EventBus.fire('diff_completed', task.path, task.diffMode);
                } else {
                    console.warn(`Received worker message for unknown task: ${message.data.name}`);
                }
                self.sendWork(worker);
            },
            
            sendWork: function (worker) {
                if (self.queue.length) {
                    const taskName = self.queue.shift();
                    worker.postMessage(self.tasks[taskName]);
                } else {
                    self.workers.splice(self.workers.indexOf(worker), 1);
                    worker.terminate();
                }
            },
            
            cancelAll: function () {
                self.workers.forEach(function (worker) {
                    worker.terminate();
                });
                self.workers = [];
                self.tasks = {};
                self.queue = [];
            }
        };
        return self;
    }
    
    const workQueue = WorkQueue();
    
    const self = {
        __proto__: Component.prototype,

        loadActiveEntry: function () {
            const path = (App.leftEntry || App.rightEntry).path,
                taskName = getTaskName(path, App.diffMode),
                task = workQueue.getTask(taskName);

            self.activeTaskName = taskName;

            if (task && task.diff) {
                self.el.innerHTML = task.diff
                    .filter(function (part) {
                        return !((App.diffMode === 'left' && part.added) || (App.diffMode === 'right' && part.removed));
                    })
                    .map(function (part) {
                        var value = Util.escapeHtml(part.value);
                        if (value === '\r\n') {
                            value = ' \n';
                        }
    
                        return part.added ? `<span class="diff-added">${value}</span>`
                            : part.removed ? `<span class="diff-removed">${value}</span>`
                            : value;
                    }).join('');
    
                self.el.setAttribute('class', path.substring(path.lastIndexOf('.') + 1));
                hljs.highlightBlock(self.el);
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
                
                workQueue.addTask(DiffTask(path, 'line', leftContent, rightContent));
                workQueue.addTask(DiffTask(path, 'char', leftContent, rightContent));
            });
        },
        
        handleDiffCompleted: function (path, diffMode) {
            if (getTaskName(path, diffMode) === self.activeTaskName) {
                self.loadActiveEntry();
            }
        }
    };

    EventBus.on('active_entry_changed', self.handleActiveEntryChanged, self);
    EventBus.on('diff_mode_changed', self.handleDiffModeChanged, self);
    EventBus.on('active_iterations_changed', self.handleIterationsChanged, self);
    EventBus.on('diff_completed', self.handleDiffCompleted, self);
    
    self.setEl(document.querySelector('.code-pane > code'));
                
    return self;
});