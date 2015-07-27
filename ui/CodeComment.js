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
                .on('keyup', this.handleCodeEdited.bind(this))[0];
            this.codeEditor.innerHTML = Util.escapeHtml(this.comment.code);
            
            this.textEditor = this.query('textarea')
                .on('keyup', this.handleTextEdited.bind(this))[0];
            this.textEditor.value = this.comment.text || '';
            this.handleTextEdited();

            function cancel(event) {
                event.stopPropagation();
            }
            this.on('mousedown', cancel)
                .on('mouseup', cancel);
            this.el.style.top = this.topOffset + 'px';
        },
        
        close: function () {
            this.destroy();
        },
        
        
        handleCodeEdited: function () {
        },
        
        handleTextEdited: function () {
            this.textEditor.setAttribute('rows', Util.countLines(this.textEditor.value) || 1);
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