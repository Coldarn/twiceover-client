define([
    'util/Util',
    'util/EventBus',
    'App',
    'ui/ImportDialog'
], function (Util, EventBus, App, ImportDialog) {
    'use strict';
    
    var codeEl = document.querySelector('.menu-bar'),
        self = {
            populate: function () {
                var iterationHtml = App.review.iterations.map(function (it, index) {
                    return `<div class="iteration">${index}</div>`;
                }).join('');
                
                codeEl.innerHTML = `Twice-Over\n${iterationHtml}`;//<div class="iteration new-iteration">+</div>`;
//                codeEl.querySelector('.new-iteration').addEventListener('click', importDialog.show.bind(importDialog));
            },
            
            handleActiveIterationsChanged: function() {
                self.populate();
            }
        };
    
    EventBus.on('active_iterations_changed', self.handleActiveIterationsChanged, self);
    
    return self;
});
