// Identifies a location of a block of code under comment in a review
define([
    'util/Util'
], function (Util) {
    'use strict';
    
    const MaxLineCount = 99999;
    
    const proto = {
        leftIteration: null,    // Index of the left iteration of the source under comment
        rightIteration: null,   // Index of the right iteration of the source under comment
        diffMode: null,         // Source diff view where the comment was made
        lineStart: null,        // Index of the first line of the comment in the source
        lineCount: null,        // Number of lines included in the comment
        
        is: function (otherCommentLoc) {
            return otherCommentLoc
                && Object.getPrototypeOf(otherCommentLoc) === proto
                && otherCommentLoc.toString() == this.toString();
        },
        
        toString: function () {
            return [
                Util.zpad(this.rightIteration, 3),          // Pad with zeroes for lex sorting, right iteration first
                Util.zpad(this.lineStart, 5),               // Then by line next
                Util.zpad(this.leftIteration, 3),           // Then by left iteration
                Util.zpad(MaxLineCount - this.lineCount, 5),// Then by number of lines, descending
                this.diffMode                               // Finally by diff mode, though this should never come up
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
                throw new Error(`CommentLocation hash could not be parsed: '${leftIt}'`);
            }
            
            obj.leftIteration = Number(parts[2]);
            obj.rightIteration = Number(parts[0]);
            obj.diffMode = parts[4];
            obj.lineStart = Number(parts[1]);
            obj.lineCount = MaxLineCount - Number(parts[3]);
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