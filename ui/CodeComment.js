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
            
            this.noteEditor = this.query('note')
                .on('blur', this.handleNoteEdited.bind(this))
                .on('paste', this.pastePlainText)[0];
            
            this.iterations = this.query('iterations');
            this.buildIterations();
            
            this.setActiveComment(this.comments[1]);

            this.el.style.top = this.topOffset + 'px';
            this.codeEditor.focus();
        },
        
        buildIterations: function () {
            this.iterations[0].innerHTML = this.comments.map(function (c, index) {
                return `<button data-index="${index}">${index}</button>`;
            }).join('') + `<button>+</button>`;
            this.iterations.queryAll('button')
                .on('click', this.handleIterationClick.bind(this));
        },
        
        setActiveComment: function (comment) {
            const commentIndex = this.comments.indexOf(comment);
            this.comment = comment;
            
            this.codeEditor.innerHTML = Util.escapeHtml(this.comment.code);
            this.syntaxHighlightCode();

            this.noteEditor.innerText = this.comment.note;
            this.noteEditor.style.display = commentIndex === 0 ? 'none' : null;
            
            this.codeEditor.contentEditable = commentIndex !== 0 && App.user.is(comment.user) || false;
            this.noteEditor.contentEditable = App.user.is(comment.user) || false;

            this.iterations.queryAll().setClass('selected', false);
            this.iterations.query(`[data-index="${commentIndex}"]`).setClass('selected', true);
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
        
        
        
        
        handleIterationClick: function (event) {
            const commentIndex = event.target.dataset.index;
            if (commentIndex) {
                this.setActiveComment(this.comments[Number(commentIndex)]);
            } else {
                this.comments.push(Comment(App.user, this.originalCode));
                this.buildIterations();
                this.setActiveComment(this.comments[this.comments.length - 1]);
            }
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
    
    return function CodeComment(topOffset, fileMeta, location, origCode) {
        var obj = Object.create(proto);
        obj.topOffset = topOffset;
        obj.originalCode = origCode;
        obj.fileMeta = fileMeta;
        obj.location = location;
        obj.comments = obj.fileMeta.getCommentsAtLocation(location);
        
        if (obj.comments.length < 1) {
            obj.comments.push(Comment(App.user, origCode));
        }
        
        obj.comment = obj.comments[0];
        obj.comments.unshift(Comment(null, origCode));
        
        obj.setHtml('text!partials/CodeComment.html');
        return obj;
    };
});