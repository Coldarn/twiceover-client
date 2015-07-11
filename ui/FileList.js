define([
    'util/Util',
    'util/EventBus',
    'App'
], function (Util, EventBus, App) {
    'use strict';
    
    var el = document.querySelector('.file-pane'),
        self = {
            populate: function () {
                var paths = Util.union(App.leftIteration.getPaths(), App.rightIteration.getPaths()),
                    fileHtml = paths.map(function (path) {
                        const splitPath = path.split('/');
                        const name = splitPath[splitPath.length - 1];
                        return `<li class="file-entry" data-path="${path}">${name}</li>`;
                    }).join('\n');
                el.innerHTML = `<ul class="file-list">${fileHtml}</ul>`;
                
                function onEntryClicked() {
                    App.setActiveEntry(this.getAttribute('data-path'));
                }
                
                Util.toArray(el.querySelectorAll('.file-entry')).forEach(function(entryEl) {
                    entryEl.addEventListener('click', onEntryClicked);
                });
                
                App.setActiveEntry((App.leftEntry && App.leftEntry.path)
                    || (App.rightEntry && App.rightEntry.path)
                    || paths[0]);
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
            }
        };
    
    EventBus.on('active_iterations_changed', self.handleActiveIterationsChanged, self);
    EventBus.on('active_entry_changed', self.handleActiveEntryChanged, self);
    
    return self;
});