define([
    'App',
    'util/Util',
    'util/EventBus',
    'om/Review',
    'om/Iteration',
    'om/FileEntry',
    'ui/Component',
    'ui/EmailEntry',
    'integrations/TfsChanges',
], function (App, Util, EventBus, Review, Iteration, FileEntry, Component, EmailEntry, TfsChanges) {
    'use strict';

    var proto = {
        __proto__: Component.prototype,
        
        initComponent: function () {
            var me = this;
            
            me.query('.import-content button.close').on('click', me.hide.bind(me));
            me.query('.import-content button.save').on('click', me.handleCreate.bind(me));
            me.query('.import-status button.close').on('click', me.handleCloseCreate.bind(me));
            
            me.query('#review-title').on('keyup', me.validateAll.bind(me));

            me.changesControl.appendTo(me.el.querySelector('#change-container'));
            me.emailControl.prependTo(me.el.querySelector('.new-review-right'));
            
            EventBus.on('change_node_selected', me.validateAll, me);
			EventBus.on('reviewer_add_remove', me.validateAll, me);
			EventBus.on('show_add_iteration_ui', me.show.bind(me, true));
        },
        
        show: function (newIteration) {
            this.showCreate(false);
            
            this.inIterationMode = !!newIteration;
            this.query('title')[0].innerText = this.inIterationMode ? 'New Iteration' : 'New Review';
            this.query('.new-review-right').setVisible(!this.inIterationMode);
            this.query('.import-content button.save')[0].innerText = this.inIterationMode ? 'Create Iteration' : 'Create Review';
            this.query('.import-content button.close').setVisible(this.inIterationMode);
            this.changesControl.loadChanges();
            
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
            var isValid = this.changesControl.getChanges().length > 0 && (this.inIterationMode
                  || (this.validateControl('#review-title', 4) && this.validateControl('#reviewer-container', 1)));

            this.el.querySelector('button.save').classList.toggle('disabled', !isValid);
            return isValid;
        },
        
        showCreate: function (show) {
            this.loadingChanges = show;
            this.queryAll('.import-content').setVisible(!show);
            this.queryAll('.import-status').setVisible(show);
        },
        
        

        
        handleCreate: function () {
            var me = this;
            
            me.showCreate(true);
            
            me.changeRecords = me.changesControl.getChanges();
            const fileList = me.query('.import-status .tree');
            fileList.queryAll('*').remove();
            me.createError = null;
            
            Promise.all(me.changeRecords.map(function (changeRecord) {
                const el = Component(`<li class="tree-node"><span>${changeRecord.displayPath}</span></li>`);
                el.appendTo(fileList);
                
                return me.changesControl.getChangeFiles(changeRecord, me.inIterationMode).then(function (files) {
                    el.el.classList.add('selected');
                    changeRecord.baseContent = files[0];
                    changeRecord.iterationContent = files[1];
                }, function (error) {
                    Component(`<div class="error">${error}</div>`).appendTo(el);
                    me.createError = error;
                });
            })).then(me.handleCreateFinished.bind(me));
        },
        
        handleCreateFinished: function () {
            if (this.loadingChanges && !this.createError) {
                if (this.inIterationMode) {
                    const rightIteration = Iteration();
                    
                    this.changeRecords.forEach(function (change) {
                        rightIteration.addEntry(FileEntry(change.iterationContent, change.displayPath));
                    });
                    
                    App.review.addIteration(rightIteration);
                    App.setActiveIterations(App.review.iterations[0], rightIteration);
                } else {
                    const title = this.el.querySelector('#review-title').value;
                    const description = this.el.querySelector('#review-description').value;
                    const review = Review(title, description);
                    const leftIteration = Iteration();
                    const rightIteration = Iteration();

                    this.changeRecords.forEach(function (change) {
                        leftIteration.addEntry(FileEntry(change.baseContent, change.displayPath));
                        rightIteration.addEntry(FileEntry(change.iterationContent, change.displayPath));
                    });
                    
                    review.addIteration(leftIteration);
                    review.addIteration(rightIteration);

                    App.setActiveReview(review);
                    App.setActiveIterations(leftIteration, rightIteration);
                }
                
                this.hide();
            }
        },
        
        handleCloseCreate: function () {
            this.showCreate(false);
        }
    };
    
    return function ImportDialog() {
        var obj = Object.create(proto);
        obj.setHtml('text!partials/ImportDialog.html');
        obj.changesControl = TfsChanges();
        obj.emailControl = EmailEntry();
        obj.loadingChanges = false;
        obj.inIterationMode = false;
        return obj;
    };
});
