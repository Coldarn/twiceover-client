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
                ('00' + this.rightIteration).slice(-3), // Pad with zeroes for lex sorting, right iteration first
                ('0000' + this.lineStart).slice(-5),    // Then by line next
                ('00' + this.leftIteration).slice(-3),  // Then by left iteration
                ('0000' + this.lineCount).slice(-5),    // Then by number of lines
                this.diffMode                           // Finally by diff mode, though this should never come up
            ].join(',');
        },
        
        valueOf: function () {
            return this.toString();
        }
    };
    
    return function CommentLocation(leftIt, rightIt, diffMode, lineStart, lineCount) {
        const obj = Object.create(proto);
        
        if (typeof leftIt === 'string') {
            const parts = leftIt.split(',');
            if (parts.length !== 5) {
                throw new Error(`CommentLocation hash could not be parsed: ${leftIt}`);
            }
            
            obj.leftIteration = Number(parts[2]);
            obj.rightIteration = Number(parts[0]);
            obj.diffMode = parts[4];
            obj.lineStart = Number(parts[1]);
            obj.lineCount = Number(parts[3]);
        } else {
            obj.leftIteration = leftIt;
            obj.rightIteration = rightIt;
            obj.diffMode = diffMode.toLowerCase();
            obj.lineStart = lineStart;
            obj.lineCount = lineCount;
        }
        return obj;
    };
});