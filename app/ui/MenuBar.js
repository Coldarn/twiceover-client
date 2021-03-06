define([
    'ui/util/Component',
    'util/EventBus',
    'App',
    'ui/Home',
    'ui/ImportDialog'
], function (Component, EventBus, App, Home, ImportDialog) {
    'use strict';

    var self = {
        __proto__: Component.prototype,

        populate: function () {
            var iterationHtml = App.review.iterations.map(function (it, index) {
                const isActive = it === App.leftIteration || it === App.rightIteration;
                const tooltip = index === 0 ? 'Unmodified Code' : 'Iteration ' + index;
                return `<div class="iteration ${isActive ? 'active' : ''}"
                    title="${tooltip}" data-index="${index}">${index}</div>`;
            }).join('');

            const addIteration = App.user.is(App.review.owningUser)
                ? `<div class="iteration new-iteration" title="Add Iteration">+</div>` : '';

            this.el.setAttribute('class', 'menu-bar ' + App.review.status);
            this.el.innerHTML = `<span class="home-button">Twice-Over</span> ${iterationHtml}${addIteration}`;

            this.query('.home-button').on('click', this.handleHomeClick);
            this.queryAll('.iteration')
                .on('click', this.handleIterationClick)
                .on('contextmenu', this.handleIterationClick);
        },

        handleHomeClick: function (e) {
            Home(true).appendTo(document.body);
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
        },

        handleReviewStatusChanged: function (event) {
            this.populate();
        }
    };

    EventBus.on('active_iterations_changed', self.handleActiveIterationsChanged, self);
    EventBus.on('review_iteration_added', self.handleActiveIterationsChanged, self);
    EventBus.on('change_review_status', self.handleReviewStatusChanged, self);

    self.setEl(document.querySelector('.menu-bar'));

    return self;
});
