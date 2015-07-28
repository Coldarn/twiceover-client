define([
    'util/Util',
    'util/EventBus',
    'ui/Component',
    'om/CommentLocation',
    'om/Comment',
    'App'
], function (Util, EventBus, Component, CommentLocation, Comment, App) {
    'use strict';
    
    const proto = {
        __proto__: Component.prototype,
        
        initComponent: function () {
            this.codeEditor = this.query('code')
                .on('blur', this.syntaxHighlightCode.bind(this))
                .on('keyup', this.handleCodeEdited.bind(this))
                .on('paste', this.pastePlainText)[0];
            this.codeEditor.innerHTML = Util.escapeHtml(this.comment.code);
            this.syntaxHighlightCode(true);
            
            this.textEditor = this.query('note')
                .on('keyup', this.handleNoteEdited.bind(this))
                .on('paste', this.pastePlainText)[0];
            this.textEditor.innerText = this.comment.text || '';

            this.el.style.top = this.topOffset + 'px';
        },
        
        pastePlainText: function (event) {
            event.preventDefault();
            if (event.clipboardData) {
                const text = event.clipboardData.getData('text/plain');
                if (text) {
                    document.execCommand('insertText', false, text);
                }
            }
        },

        syntaxHighlightCode: function (force) {
            // First, check if the code has changed
            const code = this.codeEditor.innerText;
            if (!force && this.comment.code === code) {
                return;
            }

            // Rip out any existing styling and re-style
            this.codeEditor.innerHTML = Util.escapeHtml(code);
            this.codeEditor.setAttribute('class', App.fileMeta.path.substring(App.fileMeta.path.lastIndexOf('.') + 1));
            hljs.highlightBlock(this.codeEditor);
        },
        
        close: function () {
            this.destroy();
        },
        
        
        handleCodeEdited: function () {
        },
        
        handleNoteEdited: function () {
        }
    };
    
    return function CodeCommend(topOffset, location, comment) {
        var obj = Object.create(proto);
        obj.topOffset = topOffset;
        obj.location = location;
        obj.comment = comment;
        obj.setHtml('text!partials/CodeComment.html');
        return obj;
    };
});