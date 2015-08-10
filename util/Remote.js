define([], function () {
    'use strict';
    
    const proto = {
        webSocket: null,        // WebSocket for communication
    };
    
    return function Remote(serverInfo) {
        const obj = Object.create(proto);
        obj.webSocket = new WebSocket('ws://' + serverInfo.url);
        obj.webSocket.onopen = function (event) {
            console.log('Server connected.');
        };
    };
});