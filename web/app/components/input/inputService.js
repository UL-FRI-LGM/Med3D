/**
 * Created by Primoz on 19.7.2016.
 */



app.service("InputService", function ($interval) {
    var self = this;

    // Reference to keyboard controller singleton
    this.keyboardController = M3D.KeyboardInput.instance;

    // Cursor
    this.cursor = {
        position: new THREE.Vector2(),
        down: false
    };

    window.addEventListener("mousedown", function () {
        self.cursor.down = true;
    });

    window.addEventListener("mouseup", function () {
        self.cursor.down = false;
    });

    function onMouseMove( event ) {
        self.cursor.position.x = (event.clientX / window.innerWidth) * 2 - 1;
        self.cursor.position.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    window.addEventListener( 'mousemove', onMouseMove, false );

    // Input bookkeeping
    this.navigatorsInput = {
        rotation: new THREE.Vector3(0, 0, 0),
        translation: new THREE.Vector3(0, 0, 0),
        reset: function () {
            this.rotation.set(0, 0, 0);
            this.translation.set(0, 0, 0);
        }
    };

    this.keyboardInput = {
        rotation: new THREE.Vector3(0, 0, 0),
        translation: new THREE.Vector3(0, 0, 0),
        reset: function () {
            this.rotation.set(0, 0, 0);
            this.translation.set(0, 0, 0);
        }
    };

    // Max combined input values
    var MAX_INPUT = new THREE.Vector3(1, 1, 1);
    this.combinedInput = {
        rotation: new THREE.Vector3(),
        translation: new THREE.Vector3()
    };

    this.speedMultiplier = 1;

    // Add keyboard listener
    this.keyboardController.addListener(function (pressedKeys) {
        // ROTATIONS
        if (pressedKeys[65]) {  // A
            self.keyboardInput.rotation.y = 1;
        }

        if (pressedKeys[68]) {  // D
            self.keyboardInput.rotation.y = -1;
        }

        if (pressedKeys[87]) {  // W
            self.keyboardInput.rotation.x = 1;
        }

        if (pressedKeys[83]) {  // S
            self.keyboardInput.rotation.x = -1;
        }

        if (pressedKeys[81]) {  // Q
            self.keyboardInput.rotation.z = 1;
        }

        if (pressedKeys[69]) {  // R
            self.keyboardInput.rotation.z = -1;
        }


        // TRANSLATIONS
        if (pressedKeys[39]) {  // RIGHT - Right
            self.keyboardInput.translation.x = 1;
        }

        if (pressedKeys[37]) {  // LEFT - Left
            self.keyboardInput.translation.x = -1;
        }

        if (pressedKeys[40]) {  // DOWN - Backward
            self.keyboardInput.translation.z = 1;
        }

        if (pressedKeys[38]) {  // UP - Forward
            self.keyboardInput.translation.z = -1;
        }

        if (pressedKeys[82]) {  // Q - Upward
            self.keyboardInput.translation.y = 1;
        }

        if (pressedKeys[70]) {  // F - Downward
            self.keyboardInput.translation.y = -1;
        }

        self.speedMultiplier = pressedKeys[16] ? 4 : 1;
    });

    // Updates and returns combined input values
    this.update = function () {
        // Update keyboard input
        self.keyboardInput.reset();
        self.keyboardController.update();

        // Combine keyboard and navigator rotation/translation.
        self.combinedInput.rotation.addVectors(self.keyboardInput.rotation, self.navigatorsInput.rotation).min(MAX_INPUT).multiplyScalar(self.speedMultiplier);
        self.combinedInput.translation.addVectors(self.keyboardInput.translation, self.navigatorsInput.translation).min(MAX_INPUT).multiplyScalar(self.speedMultiplier);

        return {translation: self.combinedInput.translation, rotation: self.combinedInput.rotation};
    };
});