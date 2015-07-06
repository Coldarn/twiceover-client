define([
    'integrations/TFS'
], function (TFS) {
    'use strict';
    
    function handleKeydown(event) {
        if (event.keyCode === 13) {
            handleAddReviewer();
        }
    }
    
    function handleAddReviewer() {
        var entryEl = document.getElementById('review-nameentry'),
            reviewerListEl = document.getElementById('reviewer-container');
        
        if (!entryEl.value || entryEl.value.length < 2) {
            return;
        }
        
        reviewerListEl.appendChild(
            new Range().createContextualFragment(`<div>${entryEl.value}</div>`));
        reviewerListEl.style.display = null;
        entryEl.value = '';
    }
    
    function handleGetChanges(changesEl, failure, data) {
        changesEl.innerHTML = failure ? `<div class="error">${data}</div>` : data;
        outstandingGetChanges = null;
    }
    
    var outstandingGetChanges;
    
    var self = {
        show: function (newIteration) {
            requirejs(['text!partials/ImportDialog.html'], function (html) {
                var el = document.getElementById('import-dialog'),
                    dialogEl = document.querySelector('.dialog');
                
                if (!el) {
                    var dialogEl = document.querySelector('.dialog');
                    dialogEl.innerHTML = html;
                    el = dialogEl.firstChild;
                    
                    el.querySelector('button.close').addEventListener('click', function () {
                        self.hide();
                    });
                    document.getElementById('add-reviewer').addEventListener('click', handleAddReviewer);
                    document.getElementById('review-nameentry').addEventListener('keydown', handleKeydown);
                }
                
                el.querySelector('button.close').style.display = newIteration ? null : 'none';
                dialogEl.style.display = null;
                
                if (!outstandingGetChanges) {
                    const changesContainer = document.getElementById('change-container');
                    changesContainer.innerHTML = null;
                    
                    function logStatus(message) {
                        changesContainer.appendChild(new Range().createContextualFragment(`<div>${message}</div>`));
                    }
                    
                    outstandingGetChanges = TFS.getChanges(logStatus, newIteration)
                        .then(handleGetChanges.bind(null, changesContainer, false), handleGetChanges.bind(null, changesContainer, true));
                }
            });
        },
        hide: function () {
            document.querySelector('.dialog').style.display = 'none';
        }
    };
    
    return self;
});