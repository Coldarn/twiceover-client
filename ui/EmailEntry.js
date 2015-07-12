define([
	'ui/Component',
	'util/ElementProxy',
	'util/EventBus',
    'integrations/EmailChecker'
], function (Component, ElementProxy, EventBus, EmailChecker) {
	'use strict';
	
	const proto = {
		__proto__:	Component.prototype,
		
		initComponent: function () {
			var me = this;
            
            me.entryEl = this.el.querySelector('#review-nameentry');
            me.suggestionsEl = me.el.querySelector('.email-suggestions');
            
            ElementProxy(me.suggestionsEl).on('click', function (event) {
                me.selectSuggestion(event.toElement.innerText);
            }).on('mouseover', function () {
                const focusedEl = me.suggestionsEl.querySelector('.focus');
                if (focusedEl) {
                    focusedEl.classList.remove('focus');
                }
            });
            
            me.query('#add-reviewer').on('click', me.handleAddReviewer.bind(me));
            me.query('#review-nameentry')
                .on('keydown', me.handleKeydown.bind(me))
                .on('keypress', me.handleEmailTextEntry.bind(me))
                .on('keyup', me.handleEmailTextEntry.bind(me));
		},
        
        loadSuggestions: function () {
            const me = this;
            
            if (me.pendingSuggestions || me.entryEl.value === me.lastCheckValue) {
                return;
            }
            
            const checkValue = me.entryEl.value;
            me.lastCheckValue = checkValue;
            me.pendingSuggestions = EmailChecker.getSuggestions(checkValue).then(function (suggestions) {
                me.pendingSuggestions = null;
                
                if (me.entryEl.value.length < 2) {
                    me.clearSuggestions();
                    return;
                }
                
                suggestions = suggestions.slice(0, 20);
                me.suggestionsEl.innerHTML = suggestions.map(function (email) {
                    return `<div>${email}</div>`;
                }).join('');
                me.suggestionsEl.style.display = null;
                
                if (checkValue !== me.entryEl.value) {
                    me.loadSuggestions();
                }
            });
        },
        
        clearSuggestions: function () {
            this.suggestionsEl.style.display = 'none';
            delete this.lastCheckValue;
        },
        
        selectSuggestion: function (text) {
            this.entryEl.value = text;
            this.handleAddReviewer();
        },
        
        
		
        handleKeydown: function (event) {
            const focusedSuggestionEl = this.suggestionsEl.querySelector('.focus');
            switch (event.keyCode) {
                case 13:    // Enter
                    if (!this.suggestionsEl.style.display && focusedSuggestionEl) {
                        this.selectSuggestion(focusedSuggestionEl.innerText);
                    } else {
                        this.handleAddReviewer();
                    }
                    break;
                case 38:    // Up
                    if (!focusedSuggestionEl) {
                        this.suggestionsEl.lastChild.classList.add('focus');
                    } else {
                        focusedSuggestionEl.classList.remove('focus');
                        focusedSuggestionEl.previousSibling && focusedSuggestionEl.previousSibling.classList.add('focus');
                    }
                    event.preventDefault();
                    break;
                case 40:    // Down
                    if (!focusedSuggestionEl) {
                        this.suggestionsEl.firstChild.classList.add('focus');
                    } else {
                        focusedSuggestionEl.classList.remove('focus');
                        focusedSuggestionEl.nextSibling && focusedSuggestionEl.nextSibling.classList.add('focus');
                    }
                    event.preventDefault();
                    break;
            }
        },
        
        handleEmailTextEntry: function (event) {
            if (this.entryEl.value.length > 1) {
                this.loadSuggestions();
            } else {
                this.clearSuggestions();
            }  
        },

        handleAddReviewer: function() {
            const me = this,
                reviewerListEl = this.el.querySelector('#reviewer-container');

            if (me.entryEl.value.length < 2) {
                return;
            }

            const itemEl = Component(`<div class="email"><span>${me.entryEl.value}</span><span class="fa fa-times"></span></div>`);
            itemEl.appendTo(reviewerListEl);
            itemEl.query('.fa').on('click', function () { itemEl.destroy(); });
            
            reviewerListEl.style.display = null;
            me.entryEl.value = '';
            me.clearSuggestions();
            me.entryEl.focus();
			
			EventBus.fire('reviewer_add_remove');
        }
    };
	
	return function EmailEntry() {
		var obj = Object.create(proto);
        obj.setHtml('text!partials/EmailEntry.html');
		return obj;
	};
});