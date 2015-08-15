define([
    'util/Util'
], function (Util) {
    'use strict';
    
    const proto = {
        connected: false,           // WebSocket is connected
        webSocket: null,            // WebSocket for communication
        review: null,               // Active review
        handlingRemoteEvent: false, // True when handling a remote event
        
        setReview: function (review) {
            if (this.review) {
                this.review.eventLog.unsubscribe(this.handleLocalEvent, this);
            }
            this.review = review;
            this.syncServer();
        },
        
        syncServer: function () {
            if (!this.review || !this.connected) {
                return;
            }
            
            this.review.eventLog.subscribe(this.handleLocalEvent, this);

            this.webSocket.send(JSON.stringify({
                protocol: 'syncReview',
                reviewID: this.review.id,
                title: this.review.title,
                description: this.review.description,
                owner: this.review.owningUser.toString(),
                log: this.review.eventLog.log
            }));
        },
        
        
        
        handleLocalEvent: function (event) {
            if (this.connected && !this.handlingRemoteEvent) {
                this.webSocket.send(JSON.stringify(event));
            }
        },
        
        handleRemoteEvent: function (event) {
            var me = this;
            
            me.handlingRemoteEvent = true;
            try {
                if (Array.isArray(event)) {
                    event.forEach(function (evt) {
                        me.review.eventLog.add(evt, true);
                    });
                } else {
                    me.review.eventLog.add(event, true);
                }
            } finally {
                me.handlingRemoteEvent = false;
            }
        }
    };
    
    return function Remote(serverInfo) {
        const obj = Object.create(proto);
        obj.webSocket = new ReconnectingWebSocket('ws://' + serverInfo.url);
        obj.webSocket.onopen = function (event) {
            console.log('Server connected.');
            obj.connected = true;
            obj.syncServer();
        };
        obj.webSocket.onmessage = function (evt) {
            const message = JSON.parse(evt.data);
            obj.handleRemoteEvent(message);
        };
        obj.webSocket.onclose = function (event) {
            console.log('Connection lost.');
            obj.connected = false;
        };
        return obj;
    };
});