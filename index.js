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
    'ui/ImportDialog'
], function (App, Util, Review, Iteration, FileEntry, FileList, ImportDialog) {
    function loadDiff(path) {
        var codeEl = document.getElementsByTagName('code')[0],
            diff;

        App.setActiveEntry(path);

        if (App.leftEntry && App.rightEntry) {
            diff = JsDiff.diffChars(App.leftEntry.content, App.rightEntry.content);

            codeEl.innerHTML = diff.map(function (part) {
                var value = part.value;
                if (value === '\r\n' || value === '\n') {
                    value = ' \n';
                }

                return part.added ? `<span class="diff-added">${value}</span>`
                    : part.removed ? `<span class="diff-removed">${value}</span>`
                    : part.value;
            }).join('');
        } else {
            codeEl.innerHTML = (App.leftEntry || App.rightEntry).content;
        }

        codeEl.setAttribute('class', path.substring(path.lastIndexOf('.') + 1));
        hljs.highlightBlock(codeEl);
    }


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

    loadDiff('test/jsTest.js');
    
    ImportDialog.show();
});
