define([
    'util/Util',
    'lib/reconnecting-websocket.min.js'
], function (Util, ReconnectingWebSocket) {
    'use strict';
    
    let App = null;
    
    const proto = {
        connected: false,           // WebSocket is connected
        webSocket: null,            // WebSocket for communication
        review: null,               // Active review
        
        handlingRemoteEvent: false, // True when handling a remote event
        waitingForReview: false,    // True when we're waiting to download a review
        
        loadReview: function (reviewID) {
            this.waitingForReview = reviewID;
            this.syncServer();
        },
        
        setReview: function (review) {
            if (this.review) {
                this.review.eventLog.unsubscribe(this.handleLocalEvent, this);
            }
            this.review = review;
            this.syncServer();
        },
        
        syncServer: function () {
            if (!this.connected) {
                return;
            }
            
            if (this.waitingForReview) {
                if (typeof this.waitingForReview !== 'boolean') {
                    this.webSocket.send(JSON.stringify({
                        protocol: 'loadReview',
                        reviewID: this.waitingForReview
                    }));
                    this.waitingForReview = true;
                }
            } else if (this.review) {
                this.review.eventLog.subscribe(this.handleLocalEvent, this);

                this.webSocket.send(JSON.stringify({
                    protocol: 'syncReview',
                    reviewID: this.review.id,
                    log: this.review.eventLog.log
                }));
            }
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
                    if (me.waitingForReview) {
                        App.loadReview(event);
                        me.review.eventLog.subscribe(this.handleLocalEvent, this);
                        me.waitingForReview = false;
                    } else {
                        event.forEach(function (evt) {
                            me.review.eventLog.add(evt, true);
                        });
                    }
                } else if (event.error) {
                    document.body.innerText = event.error;
                } else {
                    me.review.eventLog.add(event, true);
                }
            } finally {
                me.handlingRemoteEvent = false;
            }
        }
    };
    
    return function Remote(app) {
        App = app;
        
        const obj = Object.create(proto);
        if (App.serverUrl) {
            obj.webSocket = new ReconnectingWebSocket('ws://' + App.serverUrl);
            obj.webSocket.onopen = function (event) {
                console.warn('Server connected.');
                obj.connected = true;
                obj.syncServer();
            };
            obj.webSocket.onmessage = function (evt) {
                const message = JSON.parse(evt.data);
                obj.handleRemoteEvent(message);
            };
            obj.webSocket.onclose = function (event) {
                console.warn('Connection lost.');
                obj.connected = false;
            };
        }
        return obj;
    };
});