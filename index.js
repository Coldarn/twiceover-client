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
    'ui/MenuBar',
    'ui/FileList',
    'ui/CodeViewer',
    'ui/ImportDialog'
], function (App, Review, User, EmailChecker, ElementProxy, EventLog, MenuBar, FileList, CodeViewer, ImportDialog) {
    'use strict';

    hljs.configure({
        tabReplace: '    ', // 4 spaces
    });
    
    const gui = require('nw.gui');
    const fs = require('fs');
    
    ElementProxy(document.body).on('keydown', function (event) {
        if (event.keyCode === 120) {        // F9
            gui.Window.get().reloadDev();
        } else if (event.keyCode === 123) { // F12
            gui.Window.get().showDevTools();
        }
    });

    App.SERVER_INFO = JSON.parse(fs.readFileSync('server.json'));
    const importDialog = ImportDialog().appendTo(document.body)
    
    if (App.TEST_MODE) {
        App.user = User('John Doe', 'john.doe@example.com');
        App.loadReview(JSON.parse(fs.readFileSync('test/log-1.json')));
    } else {
        EmailChecker.getCurrentUser().then(function (user) {
            App.user = user;
        }, function (error) {
            document.body.innerText = error.toString();
        });
        importDialog.whenLoaded(function (comp) { comp.show(); });
    }
});
