
function loadDiff(leftText, rightText) {
	var codeEl = document.getElementsByTagName('code')[0];
	codeEl.innerText = rightText;
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