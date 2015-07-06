define([
    'util/Util',
    'integrations/TFS'
], function (Util, TFS) {
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
        outstandingGetChanges = null;
        
        if (failure) {
            changesEl.innerHTML = `<div class="error">${data}</div>`;
            return;
        }

        changesEl.innerHTML = buildTree(data);
        
        function expandCollapse(event) {
            var childEl = this.querySelector('ul');
            if (childEl) {
                childEl.style.display = this.classList.contains('expanded') ? 'none' : null;
            }
            this.classList.toggle('expanded');
            event.cancelBubble = true;
        }
        
        Util.toArray(changesEl.querySelectorAll('li.tree-node')).forEach(function (el) {
            el.addEventListener('click', expandCollapse);
        });
    }
    
    function buildTree(nodes) {
        let html = nodes.map(function (node) {
            if (node.children) {
                return `<li class="tree-node children expanded">${node.name} ${buildTree(node.children)}</li>`;
            } else {
                return `<li class="tree-node">${node.name}</div>`;
            }
        }).join('');
        return `<ul class="tree">${html}</ul>`;
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