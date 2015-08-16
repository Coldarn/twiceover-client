define([
    'om/User'
], function (User) {
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
		},
        
        getCurrentUser: function () {
			return new Promise(function (resolve, reject) {
                child_process.execFile("bin/EmailChecker", ['--getCurrentUser'], function (err, stdout, stderr) {
                    if (err || stderr) {
                        reject(err || stderr);
                    } else {
                        const userInfo = stdout.replace(/\r\n/g, '\n').split('\n');
                        if (userInfo.length < 3 || !userInfo[2].trim()) {
                            reject(new Error("Unable to retrieve user info from Active Directory!"));
                        } else {
                            resolve(User(userInfo[1] || userInfo[0], userInfo[2]));
                        }
                    }
                });
            });
        }
	};
});