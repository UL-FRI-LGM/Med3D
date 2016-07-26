/**
 * Created by Primoz on 26. 06. 2016.
 */

let singleton = Symbol();
let singletonEnforcer = Symbol();

M3D.KeyboardInput = class {

    constructor(enforcer) {
        // Do not allow singleton duplicates
        if(enforcer != singletonEnforcer) throw "Cannot construct singleton";

        var self = this;
        this._pressedKeys = {};
        this._listeners = [];
        
        document.addEventListener("keydown", function (event) {
            self._pressedKeys[event.keyCode] = true;
            // Disable arrow key default behavior
            if([37, 38, 39, 40].indexOf(event.keyCode) > -1) {
                event.preventDefault();
            }
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

    update() {
        for (var i = 0; i < this._listeners.length; i++) {
            this._listeners[i](this._pressedKeys)
        }
    }

    static get instance() {
        if (!this[singleton]) {
            this[singleton] = new M3D.KeyboardInput(singletonEnforcer);
        }

        return this[singleton];
    }
};