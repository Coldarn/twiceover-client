define([
    'util/Util',
    'ui/Component',
    'integrations/TFS'
], function (Util, Component, TFS) {
    'use strict';
    
    var proto = {
        __proto__: Component.prototype,
        
        initComponent: function () {
            var me = this;
            
            me.workspacePickerEl = me.el.querySelector('#workspace-picker');
            
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
            
            me.contentEl.innerHTML = `<div>Discovering changes for workspace "${workspaceName}"...</div>`;
            
            TFS.getChanges(workspaceName).then(function (changes) {
                me.contentEl.innerHTML = changes.name;
            }).catch(me.displayError.bind(me));
        },
        
        displayError: function (message) {
            this.contentEl.innerHTML = `<div class="error">${message}</div>`;
        }
    };
    
    return function TfsChanges() {
        var obj = Object.create(proto);
        obj.loadHtml('text!partials/TfsChanges.html');
        return obj;
    };
});