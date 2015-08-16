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
    'ui/ImportDialog'
], function (App, Review, User, EmailChecker, ElementProxy, EventLog, Remote, MenuBar, FileList, CodeViewer, ImportDialog) {
    'use strict';

    hljs.configure({
        tabReplace: '    ', // 4 spaces
    });
    
    const fs = require('fs');

    App.remote = Remote(App, JSON.parse(fs.readFileSync('server.json')));

    const importDialog = ImportDialog().appendTo(document.body)
    
    if (App.TEST_MODE) {
        App.user = User('Collin Arnold', 'collin@collinarnold.net');
//        App.loadReview(JSON.parse(fs.readFileSync('test/log-1.json')));
//        importDialog.whenLoaded(function (comp) { comp.show(); });
        App.remote.loadReview('rVPjZ6qv1TYcRkhGYRqy1yB');
    } else {
        EmailChecker.getCurrentUser().then(function (user) {
            App.user = user;
        }, function (error) {
            document.body.innerText = error.toString();
        });
        importDialog.whenLoaded(function (comp) { comp.show(); });
    }
});