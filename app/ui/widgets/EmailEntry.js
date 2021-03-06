define([
	'util/Util',
	'ui/util/Component',
	'ui/util/ElementProxy',
	'util/EventBus',
	'util/SavedEmails',
	'om/User',
    'integrations/EmailChecker'
], function (Util, Component, ElementProxy, EventBus, SavedEmails, User, EmailChecker) {
	'use strict';

	const proto = {
		__proto__:	Component.prototype,

		initComponent: function () {
			var me = this;

            me.entryEl = this.el.querySelector('#review-nameentry');
            me.suggestionsEl = me.el.querySelector('.email-suggestions');
            me.addButtonEl = me.el.querySelector('#add-reviewer');

            ElementProxy(me.suggestionsEl).on('click', function (event) {
                me.selectSuggestion(event.toElement.innerText);
            }).on('mouseover', function () {
                const focusedEl = me.suggestionsEl.querySelector('.focus');
                if (focusedEl) {
                    focusedEl.classList.remove('focus');
                }
            });
            ElementProxy(me.addButtonEl).on('click', me.handleAddReviewer.bind(me));
            me.query('#review-nameentry')
                .on('keydown', me.handleKeydown.bind(me))
                .on('keypress', me.handleEmailTextEntry.bind(me))
                .on('keyup', me.handleEmailTextEntry.bind(me));
		},

        getEntries: function () {
            return this.queryAll('.email > span:first-child').map(function (el) {
                return el.innerText.trim();
            });
        },

        loadSuggestions: function () {
            const me = this,
                checkValue = me.entryEl.value;

            this.checkInputValid();
            if (me.pendingSuggestions || checkValue === me.lastCheckValue) {
                return;
            }

            me.lastCheckValue = checkValue;
			me.pendingSuggestions = EmailChecker.getSuggestions(checkValue).then(function (suggestions) {
				return SavedEmails.findMatches(checkValue, suggestions.map(User)).slice(0, 20);
			}, function (err) {
				return SavedEmails.findMatches(checkValue, []).slice(0, 20);
			}).then(function (suggestions) {
                me.pendingSuggestions = null;

                if (me.entryEl.value.length < 2) {
                    me.clearSuggestions();
                    return;
                }

                me.suggestionsEl.innerHTML = suggestions.map(function (email) {
                    return `<div>${Util.escapeHtml(email.toString())}</div>`;
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

        checkInputValid: function () {
            const isValid = /[^@]+@[^@.]+\.[^@.]+/.test(this.entryEl.value);
            this.addButtonEl.classList.toggle('disabled', !isValid);
            return isValid;
        },



        handleKeydown: function (event) {
            const focusedSuggestionEl = this.suggestionsEl.querySelector('.focus');
            switch (event.keyCode) {
                case 13:    // Enter
                    if (!this.suggestionsEl.style.display && focusedSuggestionEl) {
                        this.selectSuggestion(focusedSuggestionEl.innerText);
                    } else {
                        this.handleAddReviewer(true);
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
			this.checkInputValid();
            if (this.entryEl.value.length > 1) {
                this.loadSuggestions();
            } else {
                this.clearSuggestions();
            }
        },

        handleAddReviewer: function(wasNotSuggestion) {
            const me = this,
                reviewerListEl = this.el.querySelector('.reviewer-container');

            if (me.entryEl.value.length < 2 || !me.checkInputValid()) {
                return;
            }

			if (wasNotSuggestion) {
				SavedEmails.add(me.entryEl.value);
			}

            const itemEl = Component(`<div class="email"><span>${Util.escapeHtml(me.entryEl.value)}</span><span class="fa fa-times"></span></div>`);
            itemEl.appendTo(reviewerListEl);
            itemEl.query('.fa').on('click', function () { itemEl.destroy(); });

			if (me.addCallback) {
				me.addCallback(me.entryEl.value.trim());
			}

            reviewerListEl.style.display = null;
            me.entryEl.value = '';
            me.clearSuggestions();
            me.checkInputValid();
            me.entryEl.focus();

			if (!me.addCallback) {
				EventBus.fire('reviewer_add_remove');
			}
        }
    };

	return function EmailEntry(addCallback) {
		var obj = Object.create(proto);
		obj.addCallback = addCallback;
        obj.setHtml('text!partials/EmailEntry.html');
		return obj;
	};
});
