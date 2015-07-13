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
                    return `<li class="file-entry" title="${path}" data-path="${path}">${name}</li>`;
                }).join('');
            self.listEl.innerHTML = `<ul class="file-list">${fileHtml}</ul>`;

            self.queryAll('.file-entry').on('click', function () {
                App.setActiveEntry(this.dataset.path);
            });
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
    
    EventBus.on('active_iterations_changed', self.handleActiveIterationsChanged, self);
    EventBus.on('active_entry_changed', self.handleActiveEntryChanged, self);
    EventBus.on('diff_mode_changed', self.handleDiffModeChanged, self);
    
    self.setEl(document.querySelector('.file-pane'));
    
    return self;
});