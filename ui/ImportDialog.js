define([
    'util/Util',
    'util/EventBus',
    'ui/Component',
    'ui/TfsChanges',
], function (Util, EventBus, Component, TfsChanges) {
    'use strict';

    var proto = {
        __proto__: Component.prototype,
        
        initComponent: function () {
            var me = this;
            
            me.el.querySelector('button.close').addEventListener('click', me.hide.bind(me));
            me.el.querySelector('button.save').addEventListener('click', me.handleCreate.bind(me));
            me.el.querySelector('#add-reviewer').addEventListener('click', me.handleAddReviewer.bind(me));
            me.el.querySelector('#review-nameentry').addEventListener('keydown', me.handleKeydown.bind(me));
            me.el.querySelector('#review-title').addEventListener('keyup', me.validateAll.bind(me));

            me.el.querySelector('button.close').style.display = true ? null : 'none';
            
            me.changesControl.appendTo(me.el.querySelector('#change-container'));
            
            EventBus.on('change_node_selected', me.validateAll, me);
        },
        
        show: function () {
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
                && this.changesControl.getChanges().length;

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
        },
        
        handleCreate: function () {
            var me = this;
            
            me.queryAll('.import-content').setVisible(false);
            me.query('.import-status').setVisible(true);
            
            const changeRecords = me.changesControl.getChanges();
            const fileList = me.el.querySelector('.import-status .tree');
            
            Promise.all(changeRecords.map(function (changeRecord) {
                const el = Component(`<li class="tree-node"><span>${changeRecord.displayPath}</span></li>`);
                el.appendTo(fileList);
                
                return me.changesControl.getChangeFiles(changeRecord).then(function (files) {
                    el.el.classList.add('selected');
                    changeRecord.baseContent = files[0];
                    changeRecord.iterationContent = files[1];
                }, function (error) {
                    Component(`<div class="error">${error}</div>`).appendTo(el);
                });
            })).then(function () {
                me.hide();
            });
        }
    };
    
    return function ImportDialog() {
        var obj = Object.create(proto);
        obj.setHtml('text!partials/ImportDialog.html');
        obj.changesControl = TfsChanges();
        return obj;
    };
});
