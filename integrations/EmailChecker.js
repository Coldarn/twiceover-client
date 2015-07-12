define(function () {
	'use strict';
    
    const child_process = require('child_process');

	return {
		getSuggestions: function (name) {
			return new Promise(function (resolve, reject) {
                child_process.execFile("bin/EmailChecker", [name], function (err, stdout, stderr) {
                    if (err || stderr) {
                        reject(err || stderr);
                    } else {
                        resolve(stdout
                            .replace(/\r\n/g, '\n')
                            .split('\n')
                            .filter(function (a) { return a; }));
                    }
                });
            });
		}
	};
});