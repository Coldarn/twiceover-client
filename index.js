requirejs.config({
    paths: { text: 'lib/text' }
});

requirejs([
    'App',
    'util/Util',
    'ui/MenuBar',
    'ui/FileList',
    'ui/CodeViewer',
    'ui/ImportDialog'
], function (App, Util, MenuBar, FileList, CodeViewer, ImportDialog) {
    'use strict';

    hljs.configure({
        tabReplace: '    ', // 4 spaces
    });

    ImportDialog()
        .appendTo(document.body)
        .whenLoaded(function (comp) { comp.show(); });
});
