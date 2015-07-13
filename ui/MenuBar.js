define([
    'ui/Component',
    'util/EventBus',
    'App',
    'ui/ImportDialog'
], function (Component, EventBus, App, ImportDialog) {
    'use strict';
    
    var self = {
        __proto__: Component.prototype,

        populate: function () {
            var iterationHtml = App.review.iterations.map(function (it, index) {
                const isActive = it === App.leftIteration || it === App.rightIteration;
                return `<div class="iteration"${isActive ? ' style="text-decoration: underline"' : ''}>${index}</div>`;
            }).join('');

            this.el.innerHTML = `Twice-Over ${iterationHtml}<div class="iteration new-iteration">+</div>`;
            this.query('.new-iteration').on('click', this.handleNewIterationClick.bind(this));
        },
        
        handleNewIterationClick: function () {
            EventBus.fire('show_add_iteration_ui');
        },

        handleActiveIterationsChanged: function() {
            this.populate();
        }
    };
    
    EventBus.on('active_iterations_changed', self.handleActiveIterationsChanged, self);
    
    self.setEl(document.querySelector('.menu-bar'));
    
    return self;
});
