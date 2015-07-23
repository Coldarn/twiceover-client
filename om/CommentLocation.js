// Identifies a location of a block of code under comment in a review
define([], function () {
    'use strict';
    
    const proto = {
        leftIteration: null,    // Index of the left iteration of the source under comment
        rightIteration: null,   // Index of the right iteration of the source under comment
        diffMode: null,         // Source diff view where the comment was made
        lineStart: null,        // Index of the first line of the comment in the source
        lineCount: null,        // Number of lines included in the comment
        
        toString: function () {
            return [
                ('0000' + this.lineStart).slice(-5),    // Pad with zeroes for lex sorting
                this.lineCount,
                this.leftIteration,
                this.rightIteration,
                this.diffMode
            ].join(',');
        },
        
        valueOf: function () {
            return this.toString();
        }
    };
    
    return function Comment(leftIt, rightIt, diffMode, lineStart, lineCount) {
        const obj = Object.create(proto);
        
        obj.leftIteration = leftIt;
        obj.rightIteration = rightIt;
        obj.diffMode = diffMode.toLowerCase();
        obj.lineStart = lineStart;
        obj.lineCount = lineCount;
        
        return obj;
    };
});