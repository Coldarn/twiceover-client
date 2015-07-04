define([
    'util/Util',
    'App'
], function (Util, App) {
    'use strict';
    
    var el = document.querySelector('.file-pane'),
        FileList = {
            populate: function () {
                var paths = Util.union(App.leftIteration.getPaths(), App.rightIteration.getPaths()),
                    fileHtml = paths.map(function (path) {
                        return `<li class="file-entry" data-path="${path}">${path}</li>`;
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
            
            handlers: {
                activeIterationsChanged: function() {
                    FileList.populate();
                },
                activeEntryChanged: function(path, leftEntry, rightEntry) {
                    var selFileEl = document.querySelector(`.file-entry.selected`);
                    if (selFileEl) {
                        selFileEl.classList.remove('selected');
                    }
                    document.querySelector(`.file-entry[data-path="${path}"]`).classList.add('selected');
                }
            }
        };
    
    App.subscribe(FileList.handlers);
    
    return FileList;
});