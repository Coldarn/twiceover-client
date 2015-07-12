define([
    'util/Util',
    'util/EventBus',
    'ui/Component',
    'App'
], function (Util, EventBus, Component, App) {
    'use strict';
    
    var self = {
        __proto__: Component.prototype,

        loadActiveEntry: function () {
            const path = (App.leftEntry || App.rightEntry).path,
                differ = App.diffMode === 'char' ? 'diffChars' : 'diffLines';

            if (App.leftEntry && App.rightEntry) {
                const diff = JsDiff[differ](App.leftEntry.content, App.rightEntry.content);

                self.el.innerHTML = diff
                    .filter(function (part) {
                        return !((App.diffMode === 'left' && part.added) || (App.diffMode === 'right' && part.removed));
                    })
                    .map(function (part) {
                        var value = part.value;
                        if (value === '\r\n' || value === '\n') {
                            value = ' \n';
                        }

                        return part.added ? `<span class="diff-added">${value}</span>`
                            : part.removed ? `<span class="diff-removed">${value}</span>`
                            : part.value;
                    }).join('');
            } else {
                self.el.innerHTML = App.diffMode === 'left' ? (App.leftEntry && App.leftEntry.content) || ''
                    : App.diffMode === 'right' ? (App.rightEntry && App.rightEntry.content) || ''
                    : (App.leftEntry || App.rightEntry).content;
            }

            self.el.setAttribute('class', path.substring(path.lastIndexOf('.') + 1));
            hljs.highlightBlock(self.el);
        },

        handleActiveEntryChanged: function(path, leftEntry, rightEntry) {
            self.loadActiveEntry();
        },

        handleDiffModeChanged: function (diffMode) {
            self.loadActiveEntry();
        }
    };
    
    EventBus.on('active_entry_changed', self.handleActiveEntryChanged, self);
    EventBus.on('diff_mode_changed', self.handleDiffModeChanged, self);
    
    self.setEl(document.querySelector('.code-pane > code'));
                
    return self;
});