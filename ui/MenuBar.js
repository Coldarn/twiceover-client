define([
    'util/Util',
    'App',
    'ui/ImportDialog'
], function (Util, App, ImportDialog) {
    'use strict';
    
    var codeEl = document.querySelector('.menu-bar'),
        importDialog = ImportDialog(),
        self = {
            populate: function () {
                var iterationHtml = App.review.iterations.map(function (it, index) {
                    return `<div class="iteration">${index}</div>`;
                }).join('');
                
                codeEl.innerHTML = `Twice-Over\n${iterationHtml}<div class="iteration new-iteration">+</div>`;
                codeEl.querySelector('.new-iteration').addEventListener('click', importDialog.show.bind(importDialog));
            },
            
            handlers: {
                activeIterationsChanged: function() {
                    self.populate();
                }
            }
        };
    
    importDialog.appendTo(document.body);
    App.subscribe(self.handlers);
    
    return self;
});
