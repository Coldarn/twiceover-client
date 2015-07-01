
var review = null,
    leftIteration,
    rightIteration,
    leftEntry,
    rightEntry;

function loadDiff(path) {
    var codeEl = document.getElementsByTagName('code')[0],
        diff;

    leftEntry = leftIteration.getEntry(path);
    rightEntry = rightIteration.getEntry(path);

    if (leftEntry && rightEntry) {
        diff = JsDiff.diffChars(leftEntry.content, rightEntry.content);

        codeEl.innerHTML = diff.map(function (part) {
            var value = part.value;
            if (value === '\r\n' || value === '\n') {
                value = ' \n';
            }

            return part.added ? ('<span class="diff-added">' + value + '</span>')
                : part.removed ? ('<span class="diff-removed">' + value + '</span>')
                : part.value;
        }).join('');
    } else {
        codeEl.innerHTML = (leftEntry || rightEntry).content;
    }

    hljs.highlightBlock(codeEl);
    loadFileListPane();
}

function loadFileListPane() {
    var fileListEl = document.querySelector('.file-pane');

    fileListEl.innerHTML = '<ul class="file-list">\n'
        + Util.union(leftIteration.getPaths(), rightIteration.getPaths())
            .map(function (path) {
                var activeClass = (leftEntry || rightEntry) && (leftEntry || rightEntry).path === path
                    ? 'class="selected"' : '';
                return `<li ${activeClass} onclick="loadDiff('${path}')">${path}</li>`;
            })
            .join('\n')
        + '</li>\n</ul>';
}


function createFileEntry(path, displayPath) {
    var fs = require('fs');
    return Entry(fs.readFileSync(path).toString(), displayPath || path);
}

function createReview() {
    review = Review();

    var baseItr = review.addIteration(),
        firstItr = review.addIteration();

    baseItr.addEntry(createFileEntry('test/left.js', 'test/jsTest.js'));
    firstItr.addEntry(createFileEntry('test/right.js', 'test/jsTest.js'));

    leftIteration = baseItr;
    rightIteration = firstItr;
}

hljs.configure({
    tabReplace: '    ', // 4 spaces
});

createReview();
loadFileListPane();
//loadDiff('test/jsTest.js');
