/**
 * Created by Primoz on 26. 06. 2016.
 */

M3D.SUPPRESS_DEFAULT_KEYBOARD_KEYS = [37, 38, 39, 40];

M3D.KeyboardInput = class {

    constructor(enforcer) {
        // Do not allow singleton duplicates
        if(enforcer != singletonEnforcer) { throw "Cannot construct singleton" };

        let self = this;
        this._pressedKeys = new Set();
        this._listeners = [];
        
        document.addEventListener("keydown", function (event) {
            if ( $('input:focus, textarea:focus').length > 0 ) {  return; }

            self._pressedKeys.add(event.keyCode);

            // Disable arrow key default behavior
            if(M3D.SUPPRESS_DEFAULT_KEYBOARD_KEYS.indexOf(event.keyCode) > -1) {
                event.preventDefault();
            }
        });
        
        document.addEventListener("keyup", function (event) {
            self._pressedKeys.delete(event.keyCode)
        });
    }

    // region LISTENER MANAGER
    addListener(listener) {
        this._listeners.push(listener);
    }

    rmListener(listener) {
        let i = this._listeners.indexOf(listener);

        if (i > -1) {
            this._listeners.splice(i, 1);
        }
    }

    clearListeners() {
        this._listeners = [];
    }
    // endregion

    notifyListeners() {
        for (let i = 0; i < this._listeners.length; i++) {
            this._listeners[i](this._pressedKeys)
        }
    }

    update() {
        this.notifyListeners();

        return this._pressedKeys;
    }

    static get instance() {
        if (!this[singleton]) {
            this[singleton] = new M3D.KeyboardInput(singletonEnforcer);
        }

        return this[singleton];
    }
};