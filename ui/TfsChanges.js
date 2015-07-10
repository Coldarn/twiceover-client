define([
    'util/Util',
    'ui/Component',
    'integrations/TFS'
], function (Util, Component, TFS) {
    'use strict';
    
    var outstandingGetChanges,
        workspaceChanges = {};
    
    var proto = {
        __proto__: Component.prototype,
        
        initComponent: function () {
            var me = this;
            
            me.workspacePickerEl = me.el.querySelector('#workspace-picker');
            me.enableWorkspacePicker(!outstandingGetChanges);
            if (!outstandingGetChanges) {
                workspaceChanges = {};
            }
            
            me.contentEl = me.el.querySelector('.content');
            me.contentEl.innerHTML = '<div>Discovering TFS workspaces...</div>';
            
            TFS.getWorkspace().then(function (workspaceNames) {
                switch (workspaceNames.length) {
                    case 0:
                        me.displayError('No TFS workspaces found!');
                        break;
                    default:
                        // Show the toolbar
                        me.el.querySelector('.toolbar').style.display = null;
                        
                        // Populate the workspace picker combo
                        me.workspacePickerEl.innerHTML = workspaceNames.map(function (name) {
                            return `<option>${name}</option>`;
                        }).join('\n');
                        me.workspacePickerEl.firstChild.selected = true;
                        
                        me.workspacePickerEl.addEventListener('change', function () {
                            me.loadWorkspaceChanges(this.value);
                        });
                    case 1:
                        me.loadWorkspaceChanges(workspaceNames[0]);
                        break;
                }
            }).catch(me.displayError.bind(me));
        },
        
        loadWorkspaceChanges: function (workspaceName) {
            var me = this;
            
            if (workspaceChanges[workspaceName]) {
                me.renderChanges(workspaceChanges[workspaceName]);
                return;
            }
            
            me.contentEl.innerHTML = `<div>Discovering changes for workspace "${workspaceName}"...</div>`;
            me.enableWorkspacePicker(false);
            
            outstandingGetChanges = TFS.getChanges(workspaceName).then(function (changes) {
                workspaceChanges[workspaceName] = changes;
                outstandingGetChanges = null;
                me.enableWorkspacePicker(true);
                me.renderChanges(changes);
            }).catch(me.displayError.bind(me));
        },
        
        renderChanges: function (changes) {
            var me = this;
            
            me.contentEl.innerHTML = buildTree([changes]);
            const nodes = Util.toArray(me.contentEl.querySelectorAll('li.tree-node > span'));
            nodes.forEach(function (el) {
                el.addEventListener('click', handleClickTree);
            });
            handleClickTree.call(nodes[0], { x: 10000 });
        },
        
        displayError: function (message) {
            this.contentEl.innerHTML = `<div class="error">${message}</div>`;
        },
        
        enableWorkspacePicker: function (enable) {
            this.workspacePickerEl.style.pointerEvents = enable ? null : 'none';
            this.workspacePickerEl.style.opacity = enable ? 1 : 0.5;
        }
    };
    

    function updateTreeParentEl(parentEl) {
        if (parentEl.tagName !== 'LI') {
            return;
        }

        const directChildEls = Util.toArray(parentEl.querySelector('ul').children);
        const allSelected = directChildEls.every(function (el) {
            return el.classList.contains('tree-node') && el.classList.contains('selected');
        });
        const someSelected = !allSelected && directChildEls.some(function (el) {
            return el.classList.contains('tree-node') && (el.classList.contains('selected') || el.classList.contains('partial-select'));
        });
        
        parentEl.classList.toggle('selected', allSelected);
        parentEl.classList.toggle('partial-select', someSelected);

        updateTreeParentEl(parentEl.parentNode.parentNode);
    }

    function selectTreeEl(itemEl) {
        const addClass = itemEl.classList.toggle('selected');
        itemEl.classList.remove('partial-select');

        // Select/deselect all child nodes
        Util.toArray(itemEl.querySelectorAll('.tree-node')).forEach(function (el) {
            el.classList.toggle('selected', addClass);
            el.classList.remove('partial-select');
        });

        // Select/deselect parent nodes
        updateTreeParentEl(itemEl.parentNode.parentNode);

        // TODO: Get this working after refactoring the tree to be a self-contained component
//        validateAll();
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
    
    return function TfsChanges() {
        var obj = Object.create(proto);
        obj.loadHtml('text!partials/TfsChanges.html');
        return obj;
    };
});