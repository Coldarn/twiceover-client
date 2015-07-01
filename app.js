
function loadDiff(leftText, rightText) {
    var codeEl = document.getElementsByTagName('code')[0],
        diff = JsDiff.diffChars(leftText, rightText);

    codeEl.innerHTML = diff.map(function (part) {
        var value = part.value;
        if (value === '\r\n' || value === '\n') {
            value = ' \n';
        }

        return part.added ? ('<span class="diff-added">' + value + '</span>')
            : part.removed ? ('<span class="diff-removed">' + value + '</span>')
            : part.value;
    }).join('');
    hljs.highlightBlock(codeEl);
}

function loadFiles(leftFile, rightFile) {
    var fs = require('fs');
    fs.readFile(leftFile, function (err, leftData) {
        if (err) {
            throw err;
        }

        fs.readFile(rightFile, function (err, rightData) {
            if (err) {
                throw err;
            }
            loadDiff(leftData.toString(), rightData.toString());
        });
    });
}

hljs.configure({
    tabReplace: '    ', // 4 spaces
});

loadFiles('test/left.js', 'test/right.js');
