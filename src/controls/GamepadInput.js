/**
 * Created by Primoz Lavric on 09-Mar-17.
 */

M3D.GamepadInput = class {

    constructor(enforcer) {
        // Do not allow singleton duplicates
        if (enforcer != singletonEnforcer) throw "Cannot construct singleton";

        // Gamepad detection events
        this._haveEvents = 'GamepadEvent' in window;
        this._haveWebkitEvents = 'WebKitGamepadEvent' in window;

        // Holds reference to all the active gamepads
        this._gamepads = {};

        // Start looking for gamepads
        this._initializeGamepadDetection();
    }

    _addGamepad(gamepad) {
        console.log(gamepad);
        this._gamepads[gamepad.index] = gamepad;
    }

    _removeGamepad(gamepad) {
        console.log(gamepad);
        delete this._gamepads[gamepad.index];
    }

    /**
     * Initializes the gamepad detection procedure
     * @private
     */
    _initializeGamepadDetection() {

        let self = this;

        // Callbacks
        let connectHandler = function (e) {
            self._addGamepad(e.gamepad);
        };

        let disconnectHandler = function (e) {
            self._removeGamepad(e.gamepad);
        };

        // Determine the detection method
        if (this._haveEvents) {
            window.addEventListener("gamepadconnected", connectHandler);
            window.addEventListener("gamepaddisconnected", disconnectHandler);
        } else if (_haveWebkitEvents) {
            window.addEventListener("webkitgamepadconnected", connectHandler);
            window.addEventListener("webkitgamepaddisconnected", disconnectHandler);
        } else {
            setInterval(this._scanGamepads, 500);
        }
    }

    /**
     * Used when to detect gamepads when events aren't available
     * @private
     */
    _scanGamepads() {

        // Find gamepads
        let detectedGP = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);

        for (let i = 0; i < detectedGP.length; i++) {
            // Either initialize (new gamepad) or update reference (existing gamepas)
            if (!(detectedGP[i].index in this._gamepads)) {
                initGamepad(detectedGP[i]);
            } else {
                _gamepads[detectedGP[i].index] = detectedGP[i];
            }
        }
    }


    static get instance() {
        if (!this[singleton]) {
            this[singleton] = new M3D.GamepadInput(singletonEnforcer);
        }

        return this[singleton];
    }
};

M3D.GamepadInput.instance;