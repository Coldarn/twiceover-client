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
            
            this.footer = this.query('footer');
            
            this.noteEditor = this.footer.query('note')
                .on('blur', this.handleNoteEdited.bind(this))
                .on('paste', this.pastePlainText)
                .on('keyup', this.handleNoteKeyUp.bind(this))[0];
            
            this.deleteButton = this.footer.query('.delete')
                .on('click', this.handleDeleteCommentClick.bind(this));
            
            this.iterations = this.query('iterations');
            this.buildIterations();
            
            this.setActiveComment(this.comments[1]);

            this.el.style.top = this.topOffset + 'px';
            
            this.whenLoaded(function (me) {
                me.noteEditor.focus();
            });
        },
        
        cacheComments: function () {
            this.comments = this.fileMeta.getCommentsAtLocation(this.location);

            if (this.comments.length < 1) {
                this.comments.push(Comment(App.user, this.originalCode));
            }

            this.comments.unshift(Comment(null, this.originalCode));
        },
        
        buildIterations: function () {
            this.iterations[0].innerHTML = this.comments.map(function (c, index) {
                const content = c.user
                    ? `<img src="http://www.gravatar.com/avatar/${SparkMD5.hash(c.user.email)}?s=28&d=retro" />`
                    : '0';
                return `<button title="${c.user || 'Original Code'}" data-index="${index}">${content}</button>`;
            }).join('') + `<button title="Add Comment">+</button>`;
            this.iterations.queryAll('button')
                .on('click', this.handleIterationClick.bind(this))
                .on('keydown', this.handleIterationKeyDown.bind(this));
        },
        
        restoreActiveComment: function (fallbackIndex) {
            if (this.comment) {
                const currentCommentID = this.comment.id;
                const commentIndex = Util.findIndex(this.comments, function (c) { return c.id === currentCommentID; });
                this.setActiveComment(this.comments[commentIndex >= 0 ? commentIndex : fallbackIndex]);
            }
        },
        
        setActiveComment: function (comment) {
            const commentIndex = this.comments.indexOf(comment);
            this.comment = comment;
            
            this.codeEditor.innerHTML = Util.escapeHtml(this.comment.code);
            this.syntaxHighlightCode();

            this.noteEditor.innerText = this.comment.note;
            this.footer.setVisible(commentIndex !== 0);
            
            const isEditable = commentIndex !== 0 && App.user.is(comment.user) || false;
            this.codeEditor.contentEditable = isEditable;
            this.noteEditor.contentEditable = isEditable;
            this.deleteButton.setVisible(isEditable);

            this.iterations.queryAll().setClass('selected', false);
            this.iterations.query(`[data-index="${commentIndex}"]`)
                .setClass('selected', true);
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
        
        dispose: function () {
            EventBus.off('review_comment_removed', this.handleDeleteComment, this);
        },
        
        close: function () {
            this.destroy();
        },
        
        
        
        
        handleIterationClick: function (event) {
            const commentIndex = event.currentTarget.dataset.index;
            if (commentIndex) {
                this.setActiveComment(this.comments[Number(commentIndex)]);
            } else {
                this.comments.push(Comment(App.user, this.originalCode));
                this.buildIterations();
                this.setActiveComment(this.comments[this.comments.length - 1]);
                this.noteEditor.focus();
            }
        },
        
        handleIterationKeyDown: function (event) {
            const me = this;
            const commentIndex = Number(event.currentTarget.dataset.index);
            let newIndex;
            
            switch (event.keyCode) {
                case 37:    // Left
                    newIndex = commentIndex === 0 ? null
                        : Number.isNaN(commentIndex) ? this.comments.length - 1
                        : commentIndex - 1;
                    break;
                case 39:    // Right
                    newIndex = commentIndex === this.comments.length - 1 ? null
                        : Number.isNaN(commentIndex) ? 0
                        : commentIndex + 1;
                    break;
            }
            
            if (newIndex !== undefined) {
                if (typeof newIndex === 'number') {
                    this.setActiveComment(this.comments[newIndex]);
                    setTimeout(function () {
                        me.query(`button[data-index="${newIndex}"]`)[0].focus();
                    });
                } else {
                    setTimeout(function () {
                        me.query(`button:not([data-index])`)[0].focus();
                    });
                }
            }
        },

        handleDeleteCommentClick: function (event) {
            if (this.fileMeta.getComment(this.comment.id)) {
                this.fileMeta.removeComment(this.comment.id);
            } else {
                this.handleDeleteComment({ data: { id: this.comment.id } });
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
        },
        
        handleNoteKeyUp: function (event) {
            if (event.keyCode === 13 && event.ctrlKey) {
                this.noteEditor.blur();
            }
        },

        handleAddComment: function (event) {
            this.cacheComments();
            this.buildIterations();
            this.restoreActiveComment();
        },

        handleEditComment: function (event) {
            this.restoreActiveComment();
        },

        handleDeleteComment: function (event) {
            const commentIndex = Util.findIndex(this.comments, function (c) { return c.id === event.data.id; });
            this.comments.splice(commentIndex, 1);
            this.buildIterations();
            this.restoreActiveComment(commentIndex - 1);
        },
    };
    
    return function CodeComment(topOffset, fileMeta, location, origCode) {
        var obj = Object.create(proto);
        obj.topOffset = topOffset;
        obj.originalCode = origCode;
        obj.fileMeta = fileMeta;
        obj.location = location;
        obj.cacheComments();
        obj.comment = obj.comments[1];

        EventBus.on('review_comment_added', obj.handleAddComment, obj);
        EventBus.on('review_comment_edited', obj.handleEditComment, obj);
        EventBus.on('review_comment_removed', obj.handleDeleteComment, obj);
        
        obj.setHtml('text!partials/CodeComment.html');
        return obj;
    };
});