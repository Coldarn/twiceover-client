define([
    'util/Util',
    'util/EventBus',
    'App'
], function (Util, EventBus, App) {
    'use strict';
    
    var codeEl = document.querySelector('.code-pane > code'),
        self = {
            loadActiveEntry: function (path, leftEntry, rightEntry) {
                var diff;

                if (leftEntry && rightEntry) {
                    diff = JsDiff.diffChars(leftEntry.content, rightEntry.content);

                    codeEl.innerHTML = diff.map(function (part) {
                        var value = part.value;
                        if (value === '\r\n' || value === '\n') {
                            value = ' \n';
                        }

                        return part.added ? `<span class="diff-added">${value}</span>`
                            : part.removed ? `<span class="diff-removed">${value}</span>`
                            : part.value;
                    }).join('');
                } else {
                    codeEl.innerHTML = (leftEntry || rightEntry).content;
                }

                codeEl.setAttribute('class', path.substring(path.lastIndexOf('.') + 1));
                hljs.highlightBlock(codeEl);
            },
            
            handleActiveEntryChanged: function(path, leftEntry, rightEntry) {
                self.loadActiveEntry(path, leftEntry, rightEntry);
            }
        };
    
    EventBus.on('active_entry_changed', self.handleActiveEntryChanged, self);
    
    return self;
});