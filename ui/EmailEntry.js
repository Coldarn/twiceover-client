define([
	'ui/Component',
	'util/EventBus'
], function (Component, EventBus) {
	'use strict';
	
	const proto = {
		__proto__:	Component.prototype,
		
		initComponent: function () {
			var me = this;
            me.query('#add-reviewer').on('click', me.handleAddReviewer.bind(me));
            me.query('#review-nameentry').on('keydown', me.handleKeydown.bind(me));
		},
		
        handleKeydown: function (event) {
            if (event.keyCode === 13) {
                this.handleAddReviewer();
            }
        },

        handleAddReviewer: function() {
            var entryEl = this.el.querySelector('#review-nameentry'),
                reviewerListEl = this.el.querySelector('#reviewer-container');

            if (!entryEl.value || entryEl.value.length < 2) {
                return;
            }

            const itemEl = Component(`<div class="email"><span>${entryEl.value}</span><span class="fa fa-times"></span></div>`);
            itemEl.appendTo(reviewerListEl);
            itemEl.query('.fa').on('click', function () { itemEl.destroy(); });
            
            reviewerListEl.style.display = null;
            entryEl.value = '';
			
			EventBus.fire('reviewer_add_remove');
        }
    };
	
	return function EmailEntry() {
		var obj = Object.create(proto);
        obj.setHtml('text!partials/EmailEntry.html');
		return obj;
	};
});