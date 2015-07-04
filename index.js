requirejs.config({
    paths: { text: 'lib/text' }
});

requirejs([
    'App',
    'util/Util',
    'om/Review',
    'om/Iteration',
    'om/FileEntry',
    'ui/FileList',
    'ui/CodeViewer',
    'ui/ImportDialog'
], function (App, Util, Review, Iteration, FileEntry, FileList, CodeViewer, ImportDialog) {
    'use strict';
    
    function createBaseFileEntries(fileInfo, leftIteration, rightIteration) {
        var fs = require('fs');

        leftIteration.addEntry(FileEntry(fs.readFileSync(fileInfo.basePath).toString(), fileInfo.displayPath || fileInfo.basePath));
        rightIteration.addEntry(FileEntry(fs.readFileSync(fileInfo.iterationPath).toString(), fileInfo.displayPath || fileInfo.iterationPath));
    }

    function createReview() {
        var review = Review(),
            leftIteration = review.addIteration(),
            rightIteration = review.addIteration(),
            files = getReviewFiles(true);

        files.forEach(function (fileInfo) {
            createBaseFileEntries(fileInfo, leftIteration, rightIteration);
        });
        
        App.setActiveReview(review);
        App.setActiveIterations(leftIteration, rightIteration);
    }

    // Returns an array of fileInfo objects for prospective files to code review
    function getReviewFiles(includeBaselines) {
        return [{
            basePath: 'test/left.js',
            iterationPath: 'test/right.js',
            displayPath: 'test/jsTest.js'
        }, {
            basePath: 'test/csharp1.cs',
            iterationPath: 'test/csharp2.cs',
            displayPath: 'test/csharp.cs'
        }];
    }

    hljs.configure({
        tabReplace: '    ', // 4 spaces
    });

    createReview();
    
//    ImportDialog.show();
});
