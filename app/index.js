requirejs.config({
    paths: { text: 'lib/text' }
});

requirejs([
    'App',
    'om/Review',
    'om/User',
    'integrations/EmailChecker',
    'ui/util/ElementProxy',
    'util/EventLog',
    'util/Remote',
    'ui/MenuBar',
    'ui/FileList',
    'ui/CodeViewer',
    'ui/ReviewStatus',
    'ui/Home'
], function (App, Review, User, EmailChecker, ElementProxy, EventLog, Remote, MenuBar, FileList, CodeViewer, ReveiwStatus, Home) {
    'use strict';

    hljs.configure({
        tabReplace: '    ', // 4 spaces
    });

    const fs = require('fs');
    const ipc = require('ipc');

    // Make sure we're in the correct directory
    process.chdir(__dirname + '/..');

    if (App.TEST_MODE) {
        App.user = User('John Doe', 'john.doe@example.com');
		finishInit();
    } else {
        EmailChecker.getCurrentUser().then(function (user) {
            App.user = user;
			finishInit();
        }, function (error) {
            document.body.innerText = error.toString();
        });
    }

	function finishInit() {
		let reviewToLoad = ipc.sendSync('get-review');
		if (reviewToLoad) {
			const urlParts = reviewToLoad.split('/');
			App.serverUrl = urlParts[2];
			fs.writeFile('server.json', JSON.stringify({ url: App.serverUrl }, null, 4));
			reviewToLoad = urlParts[urlParts.length - 1];
		} else {
			try {
				App.serverUrl = JSON.parse(fs.readFileSync('server.json')).url;
			} catch (err) { }
		}

		App.remote = Remote(App);

	//    App.loadReview(JSON.parse(fs.readFileSync('test/log-1.json')));

		if (reviewToLoad) {
			App.remote.loadReview(reviewToLoad);
		} else {
			Home().appendTo(document.body);
		}
	}

    ElementProxy(document.body).on('keydown', function (event) {
        if (event.keyCode === 120) {        // F9
            ipc.send('reload-window');
        } else if (event.keyCode === 123) { // F12
            ipc.send('show-dev-tools');
        }
    });
});
