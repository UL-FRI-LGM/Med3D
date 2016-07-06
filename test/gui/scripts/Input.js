/**
 * Created by Primoz on 30.6.2016.
 */

let singleton = Symbol();
let singletonEnforcer = Symbol();
let maxVec = new THREE.Vector3(1, 1, 1);

Input = class {
    constructor(enforcer) {
        // Do not allow singleton duplicates
        if(enforcer != singletonEnforcer) throw "Cannot construct singleton";

        this._keyboardInput = new M3D.KeyboardInput();

        var self = this;

        // Holds current rotation and translation input from keyboard
        this._keyboardRotation = new THREE.Vector3(); //{x: 0, y: 0, z: 0, reset: function() { this.x = 0; this.y = 0; this.z = 0; }};
        this._keyboardTranslation = new THREE.Vector3(); //{x: 0, y: 0, z: 0, reset: function() { this.x = 0; this.y = 0; this.z = 0; }};
        this._speedMultiplier = 1;

        // Add keyboard listener
        this._keyboardInput.addListener(function (pressedKeys) {
            // ROTATIONS
            if (pressedKeys[65]) {  // A
                self._keyboardRotation.y = 1;
            }

            if (pressedKeys[68]) {  // D
                self._keyboardRotation.y = -1;
            }

            if (pressedKeys[87]) {  // W
                self._keyboardRotation.x = 1;
            }

            if (pressedKeys[83]) {  // S
                self._keyboardRotation.x = -1;
            }

            if (pressedKeys[81]) {  // Q
                self._keyboardRotation.z = 1;
            }

            if (pressedKeys[69]) {  // R
                self._keyboardRotation.z = -1;
            }


            // TRANSLATIONS
            if (pressedKeys[39]) {  // RIGHT - Right
                self._keyboardTranslation.x = 1;
            }

            if (pressedKeys[37]) {  // LEFT - Left
                self._keyboardTranslation.x = -1;
            }

            if (pressedKeys[40]) {  // DOWN - Backward
                self._keyboardTranslation.z = 1;
            }

            if (pressedKeys[38]) {  // UP - Forward
                self._keyboardTranslation.z = -1;
            }

            if (pressedKeys[82]) {  // Q - Upward
                self._keyboardTranslation.y = 1;
            }

            if (pressedKeys[70]) {  // F - Downward
                self._keyboardTranslation.y = -1;
            }

            self._speedMultiplier = pressedKeys[16] ? 4 : 1;
        });

        this._rNavigatorWidget = null;
        this._tNavigatorWidget = null;

        // Holds current rotation and translation input from navigators
        this._navigatorRotation = new THREE.Vector3(); // {x: 0, y: 0, z: 0, reset: function() { this.x = 0; this.y = 0; this.z = 0; }};
        this._navigatorTranslation = new THREE.Vector3(); // {x: 0, y: 0, z: 0, reset: function() { this.x = 0; this.y = 0; this.z = 0; }};

        this._combinedRotation = new THREE.Vector3();
        this._combinedTranslation = new THREE.Vector3();
    }

    get combinedRotation() { return this._combinedRotation; }
    get rotationNavigatorAttached() { return !this._rNavigatorWidget.detached; }
    get translationNavigatorAttached() { return !this._tNavigatorWidget.detached; }

    initNavigators(rNavigatorWidget, tNavigatorWidget) {
        var self = this;

        // Reference to navigator widgets
        this._rNavigatorWidget = rNavigatorWidget;
        this._tNavigatorWidget = tNavigatorWidget;

        // Rotation navigator dragging
        this._tNavigatorWidget.draggable({
            handle: ".drag-handle"
        });

        // Translation navigator dragging
        this._rNavigatorWidget.draggable({
            handle: ".drag-handle"
        });

        // Rotation navigator detaching
        this._tNavigatorWidget.find(".navigator-btn-close").click(function() {
            self.detachNavigator("translationNavigator");
        });

        // Translation navigator detaching
        this._rNavigatorWidget.find(".navigator-btn-close").click(function() {
            self.detachNavigator("rotationNavigator");
        });


        // *******************************
        // *** TRANSLATION INTERPRETER ***
        // *******************************

        // Translation calculation
        var handleTranslationCircle = function(circle) {
            var outX = (event.clientX - circle.position().left - circle.attr("r")) / circle.attr("r");
            var outY = -((event.clientY - circle.position().top - circle.attr("r")) / circle.attr("r"));

            outX = outX > 1.0 ? 1.0 : (outX < -1.0 ? -1.0 : outX);
            outY = outY > 1.0 ? 1.0 : (outY < -1.0 ? -1.0 : outY);

            self._navigatorTranslation.x = outX;
            self._navigatorTranslation.z = -outY;
        };

        // Left side circle handler
        this._tNavigatorWidget.find(".navigator-circ-left").mousedown(function() {
            self._navigatorTranslation.y = -1;
        });

        // Right side circle handler
        this._tNavigatorWidget.find(".navigator-circ-right").mousedown(function() {
            self._navigatorTranslation.y = 1;
        });

        // Main circle drag handler
        this._tNavigatorWidget.find(".navigator-btn-circ-nav").mousedown(function() {
            handleTranslationCircle($(this));
        });

        // Main circle drag handler
        this._tNavigatorWidget.find(".navigator-btn-circ-nav").draggable({
            start: function(event, ui) {
            },
            drag: function(event, ui) {
                handleTranslationCircle(ui.helper)
            },
            stop: function(event, ui) {}
        });

        // ******************************
        // **** ROTATION INTERPRETER ****
        // ******************************

        // Rotation calculation
        var handleRotationCircle = function(circle) {
            var outX = (event.clientX - circle.position().left - circle.attr("r")) / circle.attr("r");
            var outY = -((event.clientY - circle.position().top - circle.attr("r")) / circle.attr("r"));

            outX = outX > 1.0 ? 1.0 : (outX < -1.0 ? -1.0 : outX);
            outY = outY > 1.0 ? 1.0 : (outY < -1.0 ? -1.0 : outY);

            self._navigatorRotation.y = -outX;
            self._navigatorRotation.x = outY;
        };

        // Left side circle handler
        this._rNavigatorWidget.find(".navigator-circ-left").mousedown(function() {
            self._navigatorRotation.z = 1;
        });

        // Right side circle handler
        this._rNavigatorWidget.find(".navigator-circ-right").mousedown(function() {
            self._navigatorRotation.z = -1;
        });

        // Main circle mouse-down handler
        this._rNavigatorWidget.find(".navigator-btn-circ-nav").mousedown(function() {
            handleRotationCircle($(this));
        });

        // Main circle drag handler
        this._rNavigatorWidget.find(".navigator-btn-circ-nav").draggable({
            start: function(event, ui) {
            },
            drag: function(event, ui) {
                handleRotationCircle(ui.helper);
            },
            stop: function(event, ui) {}
        });

        // ******************************
        // ******* MOUSE UP RESET *******
        // ******************************

        // Resets navigator input to the default
        $(document).mouseup(function() {
            self._navigatorRotation.set(0, 0, 0);
            self._navigatorTranslation.set(0, 0, 0);
        });
    }

    detachNavigator(name) {
        if (name === "rotationNavigator") {
            if (!this._rNavigatorWidget.detached) {
                this._rNavigatorWidget.detach();
                this._rNavigatorWidget.detached = true;
            }
        }
        else if (name === "translationNavigator") {
            if (!this._tNavigatorWidget.detached) {
                this._tNavigatorWidget.detach();
                this._tNavigatorWidget.detached = true;
            }
        }
    }

    attachNavigator(name) {
        if (name === "rotationNavigator") {
            if (this._rNavigatorWidget.detached) {
                this._rNavigatorWidget.appendTo("body").css("left", "auto").css("right", "20px").css("top", (this._rNavigatorWidget.attr("id") === "navigatorTranslation" ? 50 : 175)+"px").stop().fadeTo( "fast" , 0.5);;
                this._rNavigatorWidget.detached = false;
            }
        }
        else if (name === "translationNavigator") {
            if (this._tNavigatorWidget.detached) {
                this._tNavigatorWidget.appendTo("body").css("left", "auto").css("right", "20px").css("top", (this._tNavigatorWidget.attr("id") === "navigatorTranslation" ? 50 : 175)+"px").stop().fadeTo( "fast" , 0.5);;
                this._tNavigatorWidget.detached = false;
            }
        }
    }

    update() {
        this._keyboardRotation.set(0, 0, 0);
        this._keyboardTranslation.set(0, 0, 0);

        // Update keyboard input
        this._keyboardInput.update();

        // Combine keyboard and navigator rotation/translation.
        this._combinedRotation.addVectors(this._keyboardRotation, this._navigatorRotation).min(maxVec).multiplyScalar(this._speedMultiplier);
        this._combinedTranslation.addVectors(this._keyboardTranslation, this._navigatorTranslation).min(maxVec).multiplyScalar(this._speedMultiplier);

        return {translation: this._combinedTranslation, rotation: this._combinedRotation};
    }

    static get instance() {
        if (!this[singleton]) {
            this[singleton] = new Input(singletonEnforcer);
        }

        return this[singleton];
    }
};