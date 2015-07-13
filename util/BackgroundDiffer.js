
importScripts('../lib/diff.js');

onmessage = function (message) {
	const diffMethod = message.data.diffMode === 'char' ? 'diffChars' : 'diffLines';
	postMessage({
		name: message.data.name,
		diff: JsDiff[diffMethod](message.data.leftContent, message.data.rightContent)
	});
};