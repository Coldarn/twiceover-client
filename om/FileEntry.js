// A single version of a file in a code review
define(function () {
    'use strict';
    
    var proto = {
    };

    return function FileEntry(content, diskPath, displayPath, errorMessage) {
        var obj = Object.create(proto);

        obj.content = content;              // String content of the file or null if it couldn't be loaded
        obj.diskPath = diskPath;            // Path to the file on disk
        obj.path = displayPath;             // Path to the file, for display in the UI
        obj.errorMessage = errorMessage;    // Error message string if the file couldn't be loaded
        
        const splitPath = displayPath.split('/');
        obj.name = splitPath[splitPath.length - 1];

        return obj;
    };
});
