define([
    'App',
    'util/EventBus'
], function (App, EventBus) {
    'use strict';
    
    function DiffTask(path, diffMode, leftContent, rightContent) {
        return {
            name: DiffWorkQueue.getTaskName(path, diffMode),
            path: path,
            diffMode: diffMode,
            leftContent: leftContent,
            rightContent: rightContent,
            diff: null                  // Filled in when the background task completes
        };
    }
    
    function DiffWorkQueue() {
        const self = {
            workers: [],
            tasks: {},
            queue: [],
            
            addTask: function (path, diffMode, leftContent, rightContent) {
                const task = DiffTask(path, diffMode, leftContent, rightContent);
                if (self.tasks[task.name]) {
                    throw new Error("Task already enqueued!");
                }
                self.tasks[task.name] = task;
                self.queue.push(task.name);
                
                if (self.workers.length < (App.TEST_MODE ? 1 : 4)) {
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
    
    DiffWorkQueue.getTaskName = function (path, diffMode) {
        return `${path}+${diffMode === 'char' ? 'char' : 'line'}`;
    };
    
    return DiffWorkQueue;
});