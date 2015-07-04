define([
    'util/Util',
    'App'
], function (Util, App) {
    console.log(App.foo);
    var el = document.querySelector('.file-pane'),
        FileList = {
            populate: function () {
                var fileHtml = Util.union(App.leftIteration.getPaths(), App.rightIteration.getPaths()).map(function (path) {
                    return `<li class="file-entry" data-path="${path}">${path}</li>`;
                }).join('\n');
                el.innerHTML = `<ul class="file-list">${fileHtml}</ul>`;
                
                Util.toArray(el.querySelectorAll('.file-entry')).forEach(function(entryEl) {
                    entryEl.addEventListener('click', function () {
                        App.setActiveEntry(this.getAttribute('data-path'));
                    });
                });
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