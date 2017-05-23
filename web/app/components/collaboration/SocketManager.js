/**
 * Created by Primoz Lavric on 21-May-17.
 */


SocketStateSubscriber = class {
    constructor(connStateCallback) {
        this._connStateCallback = (connStateCallback != null) ? connStateCallback : null;

        this._eventCallbacks = {};
        this._eventNames = new Set();
    }

    onConnectionStateChange(state) {
        if (this._connStateCallback != null) {
            this._connStateCallback(state);
        }
    }

    addEventCallback(eventName, callback) {
        this._eventCallbacks[eventName] = callback;
        this._eventNames.add(eventName);
    }

    rmEventCallback(eventName, callback) {
        delete this._eventCallbacks[eventName];
        this._eventNames.delete(eventName);
    }

    hasEventCallback(eventName) {
        return this._eventNames.has(eventName);
    }

    getEventCallback(eventName) {
        return this._eventCallbacks[eventName];
    }
};

// region SocketStateSubscriber static
SocketStateSubscriber.CONNECTED = 0;
SocketStateSubscriber.DISCONNECTED = 1;
// endregion

SocketManager = class  {
    constructor(settings) {

        this._socket = null;
        this._settings = SocketManager.DEFAULT_SETTINGS;

        if (settings != null) {
            this._settings = settings;
        }

        // Subscribers
        this._socketSubscribers = [];
    }

    connectToServer() {
        let self = this;

        this._socket = io(this._settings);

        // Add the wildcard option to the sockets
        let onevent = socket.onevent;
        this._socket.onevent = function (packet) {
            let args = packet.data || [];
            onevent.call (this, packet);    // original call
            packet.data = ["*"].concat(args);
            onevent.call(this, packet);      // additional call to catch-all
        };

        // Forward connect and disconnect events
        this._socket.on('connect', function() {
            for (let i = 0; i < self._socketStateSubscribers.length; i++) {
                self._socketSubscribers[i].onConnectionStateChange(SocketStateSubscriber.CONNECTED);
            }
        });

        this._socket.on('disconnect', function() {
            for (let i = 0; i < self._socketStateSubscribers.length; i++) {
                self._socketSubscribers[i].onConnectionStateChange(SocketStateSubscriber.DISCONNECTED);
            }
        });

        // On new data received notify the subscribers
        this._socket .on("*", function(channel, data) {
            for (let i = 0; i < this._socketSubscribers.length; i++) {
                if (this._socketSubscribers[i].hasEventCallback(channel)) {
                    this._socketSubscribers[i].getEventCallback(channel)(data);
                }
            }
        });
    }

    emit(channel, data, callback) {
        if (callback == null) {
            this._socket.emit(channel, data);
        }
        else {
            this._socket.emit(channel, data, callback);
        }
    }

    // Socket subscriber management
    addSocketStateSubscriber(subscriber) {
        this._socketStateSubscribers.push(subscriber);
    }

    rmSocketStateSubscriber(subscriber) {
        let index = this._socketStateSubscribers.indexOf(subscriber);

        if (index > -1) {
            this._socketStateSubscribers.splice(index, 1);
        }
    }
};

// region SocketManager static
SocketManager.DEFAULT_SETTINGS = {transports: ["websocket", "pooling"], perMessageDeflate: {threshold: 1024}};
//endregion

