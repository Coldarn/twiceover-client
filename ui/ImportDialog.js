define([
    'util/Util',
    'integrations/TFS'
], function (Util, TFS) {
    'use strict';
    
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
        
        Util.toArray(changesEl.querySelectorAll('li.tree-node > span')).forEach(function (el) {
            el.addEventListener('click', handleClickTree);
        });
    }
    
    function updateTreeParentEl(parentEl) {
        if (parentEl.tagName !== 'LI') {
            return;
        }
        
        parentEl.classList.toggle('selected', Util.toArray(parentEl.querySelector('ul').children).every(function (el) {
            return el.classList.contains('tree-node') && el.classList.contains('selected');
        }));
        
        updateTreeParentEl(parentEl.parentNode.parentNode);
    }
    
    function selectTreeEl(itemEl) {
        const addClass = itemEl.classList.toggle('selected');
        
        // Select/deselect all child nodes
        Util.toArray(itemEl.querySelectorAll('.tree-node')).forEach(function (el) {
            el.classList.toggle('selected', addClass);
        });
        
        // Select/deselect parent nodes
        updateTreeParentEl(itemEl.parentNode.parentNode);
    }
        
    function handleClickTree(event) {
        var itemEl = this.parentNode,
            childEl = itemEl.querySelector('ul');
        
        
        if (childEl) {
            if (event.x < this.getBoundingClientRect().left + 8) {
                childEl.style.display = itemEl.classList.contains('expanded') ? 'none' : null;
                itemEl.classList.toggle('expanded');
            } else {
                selectTreeEl(itemEl);
            }
        } else {
            selectTreeEl(itemEl);
        }
        event.cancelBubble = true;
    }
    
    function buildTree(nodes) {
        let html = nodes.map(function (node) {
            if (node.children) {
                return `<li class="tree-node children expanded"><span>${node.name}</span> ${buildTree(node.children)}</li>`;
            } else {
                return `<li class="tree-node"><span>${node.name}</span></div>`;
            }
        }).join('');
        return `<ul class="tree">${html}</ul>`;
    }
    
    return self;
});