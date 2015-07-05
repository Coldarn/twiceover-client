define(function () {
    'use strict';
    
    function handleKeydown(event) {
        if (event.keyCode === 13) {
            handleAddReviewer();
        }
    }
    
    function handleAddReviewer() {
        var entryEl = document.getElementById('review-nameentry'),
            reviewerListEl = document.getElementById('revier-container');
        
        if (!entryEl.value || entryEl.value.length < 2) {
            return;
        }
        
        reviewerListEl.appendChild(
            document.createRange().createContextualFragment(`<div>${entryEl.value}</div>`));
        reviewerListEl.style.display = null;
        entryEl.value = '';
    }
    
    var ImportDialog = {
        show: function (newIteration) {
            requirejs(['text!partials/ImportDialog.html'], function (html) {
                var el = document.getElementById('import-dialog'),
                    dialogEl = document.querySelector('.dialog');
                
                if (!el) {
                    var dialogEl = document.querySelector('.dialog');
                    dialogEl.innerHTML = html;
                    el = dialogEl.firstChild;
                    
                    el.querySelector('button.close').addEventListener('click', function () {
                        ImportDialog.hide();
                    });
                    document.getElementById('add-reviewer').addEventListener('click', handleAddReviewer);
                    document.getElementById('review-nameentry').addEventListener('keydown', handleKeydown);
                }
                
                el.querySelector('button.close').style.display = newIteration ? null : 'none';
                dialogEl.style.display = null;
            });
        },
        hide: function () {
            document.querySelector('.dialog').style.display = 'none';
        }
    };
    
    return ImportDialog;
});