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
                .on('blur', this.handleCodeEdited.bind(this))
                .on('paste', this.pastePlainText)[0];
            this.codeEditor.innerHTML = Util.escapeHtml(this.comment.code);
            this.syntaxHighlightCode();
            
            this.noteEditor = this.query('note')
                .on('blur', this.handleNoteEdited.bind(this))
                .on('paste', this.pastePlainText)[0];
            this.noteEditor.innerText = this.comment.note;

            this.el.style.top = this.topOffset + 'px';
            this.codeEditor.focus();
        },
        
        hasCodeChanged: function () {
            const code = this.codeEditor.innerText;
            return this.comment.code !== code;
        },

        hasNoteChanged: function () {
            const code = this.noteEditor.innerText;
            return this.comment.note !== code;
        },
        
        hasCommentBeenSaved: function () {
            return !!App.fileMeta.getComment(this.comment.id);
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

        syntaxHighlightCode: function () {
            // Rip out any existing styling and re-style
            this.codeEditor.innerHTML = Util.escapeHtml(this.codeEditor.innerText);
            this.codeEditor.setAttribute('class', App.fileMeta.path.substring(App.fileMeta.path.lastIndexOf('.') + 1));
            hljs.highlightBlock(this.codeEditor);
        },
        
        close: function () {
            this.destroy();
        },
        
        handleCodeEdited: function () {
            if (this.hasCodeChanged()) {
                this.syntaxHighlightCode();
                this.comment.code = this.codeEditor.innerText;
                if (!this.hasCommentBeenSaved()) {
                    App.fileMeta.addComment(this.location, this.comment);
                } else {
                    App.fileMeta.editComment(this.comment.id, 'code', this.comment.code);
                }
            }
        },
        
        handleNoteEdited: function () {
            if (this.hasNoteChanged()) {
                this.comment.note = this.noteEditor.innerText;
                if (!this.hasCommentBeenSaved()) {
                    App.fileMeta.addComment(this.location, this.comment);
                } else {
                    App.fileMeta.editComment(this.comment.id, 'note', this.comment.note);
                }
            }
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