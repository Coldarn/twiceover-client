requirejs.config({
    paths: { text: 'lib/text' }
});

requirejs([
    'App',
    'util/Util',
    'om/Review',
    'om/Iteration',
    'om/FileEntry',
    'ui/ImportDialog'
], function (App, Util, Review, Iteration, FileEntry, ImportDialog) {
    function loadDiff(path) {
        var codeEl = document.getElementsByTagName('code')[0],
            selFileEl = document.querySelector(`.file-entry.selected`),
            diff;

        App.leftEntry = App.leftIteration.getEntry(path);
        App.rightEntry = App.rightIteration.getEntry(path);

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

        if (selFileEl) {
            selFileEl.classList.remove('selected');
        }
        document.querySelector(`.file-entry[data-path="${path}"]`).classList.add('selected');
    }

    function loadFileListPane() {
        var fileListEl = document.querySelector('.file-pane');

        fileListEl.innerHTML = '<ul class="file-list">\n'
            + Util.union(App.leftIteration.getPaths(), App.rightIteration.getPaths())
                .map(function (path) {
                    return `<li class="file-entry" data-path="${path}" onclick="loadDiff('${path}')">${path}</li>`;
                })
                .join('\n')
            + '</ul>';
    }


    function createBaseFileEntries(leftPath, rightPath, displayPath) {
        var fs = require('fs');

        App.leftIteration.addEntry(FileEntry(fs.readFileSync(leftPath).toString(), displayPath || leftPath));
        App.rightIteration.addEntry(FileEntry(fs.readFileSync(rightPath).toString(), displayPath || rightPath));
    }

    function createReview() {
        App.setReview(Review());

        App.leftIteration = App.review.addIteration(),
        App.rightIteration = App.review.addIteration();

        var files = getReviewFiles(true);

        files.forEach(function (fileInfo) {
            createBaseFileEntries(fileInfo.basePath, fileInfo.iterationPath, fileInfo.displayPath);
        });
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
    loadFileListPane();

    loadDiff('test/jsTest.js');
    
    ImportDialog.show();
});
