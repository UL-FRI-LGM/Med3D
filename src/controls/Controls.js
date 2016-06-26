/**
 * Created by Primoz on 26. 06. 2016.
 */

M3D.Controls = class {

    constructor() {
        var self = this;
        this._pressedKeys = {};
        this._listeners = [];
        
        document.addEventListener("keydown", function (event) {
            self._pressedKeys[event.keyCode] = true;
        });
        
        document.addEventListener("keyup", function (event) {
            self._pressedKeys[event.keyCode] = false;
        });
    }

    addListener(listener) {
        this._listeners.push(listener);
    }

    rmListener(listener) {
        var i = this._listeners.indexOf(listener);

        if (i > -1) {
            this._listeners.splice(i, 1);
        }
    }

    clearListeners() {
        this._listeners = [];
    }

    update(dt) {
        for (var i = 0; i < this._listeners.length; i++) {
            this._listeners[i](dt, this._pressedKeys)
        }
    }
};