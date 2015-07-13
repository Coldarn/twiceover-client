define([
    'util/Util',
    'util/EventBus',
    'ui/Component',
    'integrations/TFS'
], function (Util, EventBus, Component, TFS) {
    'use strict';
    
    var outstandingGetChanges,
        workspaceChanges = {},
        activeWorkspace;
    
    var proto = {
        __proto__: Component.prototype,
        
        initComponent: function () {
            var me = this;
            
            me.workspacePickerEl = me.el.querySelector('#workspace-picker');
            me.enableWorkspacePicker(!outstandingGetChanges);
            
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
        
        loadChanges: function () {
            if (!this.workspacePickerEl) {
                return;
            }
            if (!outstandingGetChanges) {
                workspaceChanges = {};
            }
            this.loadWorkspaceChanges(this.workspacePickerEl.value);
        },
        
        getChanges: function () {
            return Util.toArray(this.el.querySelectorAll('.tree-node.selected.change-file')).map(function (el) {
                return el.fileChange;
            });
        },
        
        getChangeFiles: function (changeRecord, localFilesOnly) {
            return TFS.getChangeFiles(activeWorkspace, changeRecord, localFilesOnly);
        },
        
        loadWorkspaceChanges: function (workspaceName) {
            var me = this;
            
            activeWorkspace = workspaceName;
            if (workspaceChanges[workspaceName]) {
                me.renderChanges();
                return;
            }
            
            me.contentEl.innerHTML = `<div>Discovering changes for workspace "${workspaceName}"...</div>`;
            me.enableWorkspacePicker(false);
            
            outstandingGetChanges = TFS.getChanges(workspaceName).then(function (changes) {
                outstandingGetChanges = null;
                me.enableWorkspacePicker(true);
                
                workspaceChanges[workspaceName] = buildTree(Util.collapseCommonPaths(changes));
                me.renderChanges();
            }).catch(me.displayError.bind(me));
        },
        
        renderChanges: function () {
            var me = this;
            me.contentEl.innerHTML = null;
            workspaceChanges[activeWorkspace].appendTo(me.contentEl);
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

        EventBus.fire('change_node_selected');
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
        let elements = nodes.map(function (node) {
            var fileEl;
            if (node.children) {
                fileEl = Component(`<li class="tree-node children expanded selected"><span>${node.name}</span></li>`);
                fileEl.append(buildTree(node.children));
            } else {
                fileEl = Component(`<li class="tree-node selected change-file"><span>${node.name}</span></li>`);
                fileEl.el.fileChange = node;
            }
            fileEl.el.querySelector('span').addEventListener('click', handleClickTree);
            return fileEl;
        });
        return Component(`<ul class="tree"></ul>`).append(elements);
    }
    
    return function TfsChanges() {
        var obj = Object.create(proto);
        obj.setHtml('text!partials/TfsChanges.html');
        return obj;
    };
});