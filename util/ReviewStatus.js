define([
    'util/Util',
    'util/EventBus',
    'util/EventLog'
], function (Util, EventBus, EventLog) {
    'use strict';
    
    const proto = {
        
        reviewID: null,         // ID of the review this instance is tracking status for
        commentsSeen: null,     // Map of paths to arrays of seen comment locations
        
        setCommentSeen: function (filePath, commentLocation, seen) {
            const locations = this.commentsSeen[filePath.toLowerCase()] || (this.commentsSeen[filePath.toLowerCase()] = []);
            const index = locations.indexOf(commentLocation.toString());
            if (index < 0) {
                if (seen) {
                    locations.push(commentLocation.toString());
                }
            } else {
                if (!seen) {
                    locations.splice(index, 1);
                }
            }
            this.save();
        },
    
        isCommentSeen: function (filePath, commentLocation) {
            const locations = this.commentsSeen[filePath.toLowerCase()];
            return locations && locations.indexOf(commentLocation.toString()) >= 0;
        },
        
        
        
        save: function () {
            localStorage[this.reviewID] = JSON.stringify(this);
        }
    };
    
    return function ReviewStatus(reviewID) {
        const oldValue = JSON.parse(localStorage[reviewID] || '{}');
        const obj = Object.create(proto);
        
        obj.reviewID = reviewID;
        obj.commentsSeen = oldValue.commentsSeen || {};
        
        return obj;
    };
});