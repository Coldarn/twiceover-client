// A single version of a file in a code review
define(function () {
    var proto = {
    };

    return function FileEntry(content, path, errorMessage) {
        var obj = Object.create(proto);

        obj.content = content;          // String content of the file or null if it couldn't be loaded
        obj.path = path;                // Path to the file, for display in the UI
        obj.comments = [];              // Array of source comments objects
        obj.errorMessage = errorMessage;     // Error message string if the file couldn't be loaded

        return obj;
    };
});
