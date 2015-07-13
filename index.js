requirejs.config({
    paths: { text: 'lib/text' }
});

requirejs([
    'App',
    'util/ElementProxy',
    'ui/MenuBar',
    'ui/FileList',
    'ui/CodeViewer',
    'ui/ImportDialog'
], function (App, ElementProxy, MenuBar, FileList, CodeViewer, ImportDialog) {
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

    ImportDialog()
        .appendTo(document.body)
        .whenLoaded(function (comp) { comp.show(); });
});
