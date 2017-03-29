/**
 * Created by Primoz on 19.7.2016.
 */

app.service("InputService", function () {

    this.multiplier = 5;

    // region KEYBOARD ACTIONS
    this.ACTION = {
        ROT_X_NEG: 0,
        ROT_X_POS: 1,
        ROT_Y_NEG: 2,
        ROT_Y_POS: 3,
        ROT_Z_NEG: 4,
        ROT_Z_POS: 5,

        MV_X_NEG: 6,
        MV_X_POS: 7,
        MV_Y_NEG: 8,
        MV_Y_POS: 9,
        MV_Z_NEG: 10,
        MV_Z_POS: 11,
    };
    // endregion

    // region DEFAULT KEYMAP INIT
    this.DEFAULT_KEYMAP = {};
    this.DEFAULT_KEYMAP[83] = this.ACTION.ROT_X_NEG; // S
    this.DEFAULT_KEYMAP[87] = this.ACTION.ROT_X_POS; // W

    this.DEFAULT_KEYMAP[68] = this.ACTION.ROT_Y_NEG; // D
    this.DEFAULT_KEYMAP[65] = this.ACTION.ROT_Y_POS; // A

    this.DEFAULT_KEYMAP[69] = this.ACTION.ROT_Z_NEG; // R
    this.DEFAULT_KEYMAP[81] = this.ACTION.ROT_Z_POS; // Q

    this.DEFAULT_KEYMAP[37] = this.ACTION.MV_X_NEG; // LEFT ARROW
    this.DEFAULT_KEYMAP[39] = this.ACTION.MV_X_POS; // RIGHT ARROW

    this.DEFAULT_KEYMAP[38] = this.ACTION.MV_Z_NEG; // UP ARROW
    this.DEFAULT_KEYMAP[40] = this.ACTION.MV_Z_POS; // DOWN ARROW

    this.DEFAULT_KEYMAP[70] = this.ACTION.MV_Y_NEG; // R
    this.DEFAULT_KEYMAP[82] = this.ACTION.MV_Y_POS; // F
    // endregion

    // Holds currently active keyboard keymap
    this.activeKeymap = JSON.parse(JSON.stringify(this.DEFAULT_KEYMAP));

    let self = this;

    // Reference to the keyboard controller singleton
    let keyboardManager = M3D.KeyboardInput.instance;

    // Reference to the gamepad controller singleton
    let gamepadManager = M3D.GamepadInput.instance;

    // Reference to the mouse controller singleton
    let mouseManager = M3D.MouseInput.instance;

    // Structures used to hold navigators input data
    this.navigatorsInput = {
        rotation: new THREE.Vector3(0, 0, 0),
        translation: new THREE.Vector3(0, 0, 0),
        reset: function () {
            this.rotation.set(0, 0, 0);
            this.translation.set(0, 0, 0);
        }
    };

    let keyboardInput = new Set();
    let inputData = null;

    // Updates and returns combined input values
    this.update = function () {
        keyboardInput.clear();

        // Map the keys into actions using the active keymap
        let pressedKeys = Array.from(keyboardManager.update());

        for (let i = 0; i < pressedKeys.length; i++) {
            let action = self.activeKeymap[pressedKeys[i]];

            if (action != null) {
                keyboardInput.add(action);
            }
        }

        // Combine input data
        inputData = { keyboard: keyboardInput,
                      mouse: mouseManager.update(),
                      gamepads: gamepadManager.update(),
                      navigators: self.navigatorsInput,
                      multiplier: self.multiplier };

        return inputData;
    };

    /**
     * Animation loop should call update before calling this function
     * @returns {*} inputData
     */
    this.getInputData = function () {
        return inputData;
    };

    this.setMouseSourceObject = function (object) {
        mouseManager.setSourceObject(object);
    }
});