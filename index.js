requirejs.config({
    paths: { text: 'lib/text' }
});

requirejs([
    'App',
    'om/User',
    'integrations/EmailChecker',
    'util/ElementProxy',
    'ui/MenuBar',
    'ui/FileList',
    'ui/CodeViewer',
    'ui/ImportDialog'
], function (App, User, EmailChecker, ElementProxy, MenuBar, FileList, CodeViewer, ImportDialog) {
    'use strict';

    hljs.configure({
        tabReplace: '    ', // 4 spaces
    });
    
    var gui = require('nw.gui');
    
    ElementProxy(document.body).on('keydown', function (event) {
        if (event.keyCode === 120) {        // F9
            gui.Window.get().reloadDev();
        } else if (event.keyCode === 123) { // F12
            gui.Window.get().showDevTools();
        }
    });
    
    if (App.TEST_MODE) {
        App.user = User('John Doe', 'john.doe@example.com');
    } else {
        EmailChecker.getCurrentUser().then(function (user) {
            App.user = user;
        }, function (error) {
            document.body.innerText = error.toString();
        });
    }

    ImportDialog()
        .appendTo(document.body)
        .whenLoaded(function (comp) { comp.show(); });
});
