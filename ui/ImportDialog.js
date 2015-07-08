define([
    'util/Util',
    'ui/Component',
    'integrations/TFS'
], function (Util, Component, TFS) {
    'use strict';

    var outstandingGetChanges;

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
            me.el.querySelector('#add-reviewer').addEventListener('click', handleAddReviewer);
            me.el.querySelector('#review-nameentry').addEventListener('keydown', handleKeydown);
            me.el.querySelector('#review-title').addEventListener('keyup', me.validateAll.bind(me));

            me.el.querySelector('button.close').style.display = true ? null : 'none';
        },
        
        show: function () {
            var me = this;
            
            if (!outstandingGetChanges) {
                const changesContainer = me.el.querySelector('#change-container');
                changesContainer.innerHTML = null;

                function logStatus(message) {
                    changesContainer.appendChild(new Range().createContextualFragment(`<div>${message}</div>`));
                }

                outstandingGetChanges = TFS.getChanges(logStatus)
                    .then(handleGetChanges.bind(null, changesContainer, false), handleGetChanges.bind(null, changesContainer, true));
            }
            
            this.setVisible(true);
        },
        
        hide: function () {
            this.setVisible(false);
        },

        validateControl: function (selector, minLength) {
            var el = this.el.querySelector(selector);
            return el.value ? el.value.length >= minLength : el.children.length >= minLength;
        },

        validateAll: function() {
            var isValid = validateControl('#review-title', 4)
                && validateControl('#reviewer-container', 1)
                && this.el.querySelector('.tree-node.selected');

            this.el.querySelector('button.save').classList.toggle('disabled', !isValid);
            return isValid;
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
        validateAll();
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

        validateAll();
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

    return function ImportDialog() {
        var obj = Object.create(proto);
        obj.loadHtml('text!partials/ImportDialog.html');
        return obj;
    };
});
