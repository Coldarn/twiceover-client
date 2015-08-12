define([
    'util/Util'
], function (Util) {
    'use strict';
    
    const proto = {
        webSocket: null,        // WebSocket for communication
    };
    
    return function Remote(serverInfo) {
        const obj = Object.create(proto);
        obj.webSocket = new ReconnectingWebSocket('ws://' + serverInfo.url);
        obj.webSocket.onopen = function (event) {
            console.log('Server connected.');
            
            obj.webSocket.send(JSON.stringify({
                type: 'time-sync',
                clientSend: Util.highResTime()
            }));
        };
        obj.webSocket.onmessage = function (evt) {
            const message = JSON.parse(evt.data);
            if (message.type === 'time-sync') {
                const clientReceive = Util.highResTime();
                console.log('Time offset:', ((message.serverReceive - message.clientSend) + (message.serverSend - clientReceive)) / 2);
            }
        };
        obj.webSocket.onclose = function (event) {
            console.log('Server connection lost.');
        };
    };
});