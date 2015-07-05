define([
    'util/Util',
    'App'
], function (Util, App) {
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
            
            handlers: {
                activeEntryChanged: function(path, leftEntry, rightEntry) {
                    self.loadActiveEntry(path, leftEntry, rightEntry);
                }
            }
        };
    
    App.subscribe(self.handlers);
    
    return self;
});