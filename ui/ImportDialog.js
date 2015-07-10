define([
    'util/Util',
    'ui/Component',
    'ui/TfsChanges',
    'integrations/TFS'
], function (Util, Component, TfsChanges, TFS) {
    'use strict';

    var proto = {
        __proto__: Component.prototype,
        
        initComponent: function () {
            var me = this;
            
            me.el.querySelector('button.close').addEventListener('click', function () {
                me.hide();
            });
            me.el.querySelector('button.save').addEventListener('click', function () {
                if (me.validateAll()) {
                    me.hide();
                }
            });
            me.el.querySelector('#add-reviewer').addEventListener('click', me.handleAddReviewer.bind(me));
            me.el.querySelector('#review-nameentry').addEventListener('keydown', me.handleKeydown.bind(me));
            me.el.querySelector('#review-title').addEventListener('keyup', me.validateAll.bind(me));

            me.el.querySelector('button.close').style.display = true ? null : 'none';
            
            me.changesControl.appendTo(me.el.querySelector('#change-container'));
        },
        
        show: function () {
            var me = this;
            
//            if (!outstandingGetChanges) {
//                const changesContainer = me.el.querySelector('#change-container');
//                changesContainer.innerHTML = null;
//
//                function logStatus(message) {
//                    changesContainer.appendChild(new Range().createContextualFragment(`<div>${message}</div>`));
//                }
//
//                outstandingGetChanges = TFS.getChanges(logStatus)
//                    .then(me.handleGetChanges.bind(me, changesContainer, false), me.handleGetChanges.bind(me, changesContainer, true));
//            }
            
            this.setVisible(true);
        },
        
        hide: function () {
            this.setVisible(false);
        },

        validateControl: function (selector, minLength) {
            var el = this.el.querySelector(selector);
            return el.value ? el.value.length >= minLength : el.children.length >= minLength;
        },

        validateAll: function () {
            var isValid = this.validateControl('#review-title', 4)
                && this.validateControl('#reviewer-container', 1)
                && this.el.querySelector('.tree-node.selected');

            this.el.querySelector('button.save').classList.toggle('disabled', !isValid);
            return isValid;
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

            reviewerListEl.appendChild(new Range().createContextualFragment(`<div>${entryEl.value}</div>`));
            reviewerListEl.style.display = null;
            entryEl.value = '';
            this.validateAll();
        }
    };
    
    return function ImportDialog() {
        var obj = Object.create(proto);
        obj.loadHtml('text!partials/ImportDialog.html');
        obj.changesControl = TfsChanges();
        return obj;
    };
});
