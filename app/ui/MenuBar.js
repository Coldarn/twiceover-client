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
                return `<div class="iteration ${isActive ? 'active' : ''}" data-index="${index}">${index}</div>`;
            }).join('');

            this.el.innerHTML = `Twice-Over ${iterationHtml}<div class="iteration new-iteration">+</div>`;
            
            this.queryAll('.iteration')
                .on('click', this.handleIterationClick)
                .on('contextmenu', this.handleIterationClick);
        },
        
        handleIterationClick: function (e) {
            e.preventDefault();
            
            if (this.classList.contains('new-iteration')) {
                ImportDialog().appendTo(document.body).whenLoaded(function (comp) { comp.show(true); });
            } else {
                const clickedIndex = Number(this.dataset.index);
                let leftIndex = App.leftIteration.index,
                    rightIndex = App.rightIteration.index;
                
                if (e.button !== 0 || e.ctrlKey) {
                    leftIndex = Math.min(clickedIndex, App.review.iterations.length - 2);
                    if (clickedIndex >= rightIndex) {
                        rightIndex = leftIndex + 1;
                    }
                } else {
                    rightIndex = Math.max(clickedIndex, 1);
                    if (clickedIndex <= leftIndex) {
                        leftIndex = rightIndex - 1;
                    }
                }
                App.setActiveIterations(leftIndex, rightIndex);
            }
            
            return false;
        },

        handleActiveIterationsChanged: function() {
            this.populate();
        }
    };
    
    EventBus.on('active_iterations_changed', self.handleActiveIterationsChanged, self);
    EventBus.on('review_iteration_added', self.handleActiveIterationsChanged, self);
    
    self.setEl(document.querySelector('.menu-bar'));
    
    return self;
});
