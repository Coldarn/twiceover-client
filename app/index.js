requirejs.config({
    paths: { text: 'lib/text' }
});

requirejs([
    'App',
    'om/Review',
    'om/User',
    'integrations/EmailChecker',
    'util/ElementProxy',
    'util/EventLog',
    'util/Remote',
    'ui/MenuBar',
    'ui/FileList',
    'ui/CodeViewer',
    'ui/Home'
], function (App, Review, User, EmailChecker, ElementProxy, EventLog, Remote, MenuBar, FileList, CodeViewer, Home) {
    'use strict';

    hljs.configure({
        tabReplace: '    ', // 4 spaces
    });
    
    const fs = require('fs');
    const ipc = require('ipc');

    try {
        // Make sure we're in the correct directory
        fs.statSync('TwiceOver.exe');
        process.chdir('resources/app');
    } catch (err) { }
    
    if (App.TEST_MODE) {
        App.user = User('John Doe', 'john.doe@example.com');
    } else {
        EmailChecker.getCurrentUser().then(function (user) {
            App.user = user;
        }, function (error) {
            document.body.innerText = error.toString();
        });
    }

    let reviewToLoad = ipc.sendSync('get-review');
    if (reviewToLoad) {
        const urlParts = serverInfo.split('/');
        App.serverUrl = urlParts[2];
        fs.writeFile('server.json', JSON.stringify({ url: App.serverUrl }, null, 4));
        reviewToLoad = Number(urlParts[urlParts.length - 1]);
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
    
    ElementProxy(document.body).on('keydown', function (event) {
        if (event.keyCode === 120) {        // F9
            ipc.send('reload-window');
        } else if (event.keyCode === 123) { // F12
            ipc.send('show-dev-tools');
        }
    });
});
