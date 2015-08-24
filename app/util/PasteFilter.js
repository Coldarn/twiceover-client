define([
    'util/ElementProxy'
], function (ElementProxy) {
    'use strict';

    function pastePlainText(event) {
        event.preventDefault();
        if (event.clipboardData) {
            const text = event.clipboardData.getData('text/plain');
            if (text) {
                document.execCommand('insertText', false, text);
            }
        }
    }

    return function PasteFilter(element) {
        ElementProxy(element).on('paste', pastePlainText);
    };
});
