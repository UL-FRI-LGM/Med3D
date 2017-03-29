/**
 * Created by Primoz Lavric on 23-Mar-17.
 */

CameraManager = class {

    constructor() {

        // Currently selected camera
        this._activeCamera = null;

        // List of all of the own cameras
        this._cameras = [];

        // Maps camera uuid to the controls that are used for that camera
        this._cameraControls = {};

        // Dictionary of all of the cameras that are shared with this user
        this._sharedCameras = {};

        this._aspectRatio = 1;
    }

    update(inputData, deltaT) {
        // Update active camera
        if (this._activeCamera != null) {
            // Update aspect ratio for both own and shared cameras
            this._activeCamera.aspect = this._aspectRatio;

            if (this.isOwnCamera(this._activeCamera)) {
                this._cameraControls[this._activeCamera._uuid].update(inputData, deltaT);
            }
        }

        // Update animations of non-active cameras
        for (let i = 0; i < this._cameras.length; i++) {
            if (this._cameras[i] !== this._activeCamera) {
                this._cameraControls[this._cameras[i]._uuid].update(null, deltaT);
            }
        }
    }

    isOwnCamera(camera) {
        return this._cameras.indexOf(camera) >= 0;
    }

    /**
     * Creates new regular camera and controls for it
     * @param camera Camera to be added
     */
    addRegularCamera(camera) {
        this._cameras.push(camera);
        this._cameraControls[camera._uuid] = new M3D.RegularCameraControls(camera);
    }

    /**
     * Creates new orbit camera and controls for it
     * @param camera Camera to be added
     * @param orbitCenter Center of the orbit
     */
    addOrbitCamera(camera, orbitCenter) {
        this._cameras.push(camera);
        this._cameraControls[camera._uuid] = new M3D.OrbitCameraControls(camera, orbitCenter);
    }

    /**
     * Check if the camera is shared. Returns user id if found otherwise null
     * @param camera
     */
    isSharedCamera(camera) {
        for (let userId in this._sharedCameras) {
            if (this._sharedCameras[userId].list.indexOf(camera) >= 0) {
                return userId;
            }
        }

        return null;
    }

    /**
     * Clears all shared camera entries. If a shared camera is currently active it sets the first own camera as active
     * camera.
     */
    clearSharedCameras() {
        this._sharedCameras = [];

        if (!this.isOwnCamera(this._activeCamera)) {
            this._activeCamera = this._cameras[0];
        }
    }

    setSharedCameras(sharedCameras) {
        this._sharedCameras = sharedCameras;
    }

    /**
     * Sets the given camera as active camera.
     * @param camera
     */
    setActiveCamera(camera) {
        if (!this.isOwnCamera(camera) && !this.isSharedCamera(camera)) {
            console.error("Tried to set the camera that is managed by the camera manager as the active camera!")
            return
        }

        this._activeCamera = camera;
    }

    /**
     * Cancels the camera animation with the given id.
     * @param camera Camera (should be enrolled in the camera manager)
     * @param id Animation identificator
     */
    cancelAnimation(camera, id) {
        let cameraControls = this._cameraControls[camera._uuid];

        if (cameraControls != null) {
            cameraControls.cancelAnimation(id);
        }
        else {
            console.warn("Cannot cancel camera animations. Controls for the given camera do not exist.")
        }
    }

    /**
     * Cancels all of the camera animations
     * @param camera Camera (should be enrolled in the camera manager)
     */
    cancelAllAnimations(camera) {
        let cameraControls = this._cameraControls[camera._uuid];

        if (cameraControls != null) {
            cameraControls.cancelAllAnimations();
        }
        else {
            console.warn("Cannot cancel camera animations. Controls for the given camera do not exist.")
        }
    }

    /**
     * Enqueues the animation with specified parameters for the given camera
     * @param camera Camera that is to be animated (should be enrolled in the camera manager)
     * @param id Animation identificator
     * @param position Target position
     * @param rotation Target rotation
     * @param time Animation time specified in milliseconds
     * @param onFinish Callback that is called after the animation finishes
     */
    animateCameraTo(camera, id, position, rotation, time, onFinish = null) {
        let cameraControls = this._cameraControls[camera._uuid];

        if (cameraControls != null) {
            cameraControls.animateTo(id, position, rotation, time, onFinish);
        }
        else {
            console.warn("Cannot execute camera animation. Controls for the given camera do not exist.")
        }
    }

    /**
     * Locks the camera in place. While locked the camera is not affected by the user input.
     * @param camera Camera to be locked
     */
    lockCamera(camera) {
        let cameraControls = this._cameraControls[camera._uuid];

        if (cameraControls != null) {
            cameraControls.locked = true;
        }
        else {
            console.warn("Cannot lock the camera. Controls for the given camera do not exist.")
        }
    }

    /**
     * Unlocks the camera in place. While unlocked the camera will be affected by the user input.
     * @param camera Camera to be unlocked
     */
    unlockCamera(camera) {
        let cameraControls = this._cameraControls[camera._uuid];

        if (cameraControls != null) {
            cameraControls.locked = false;
        }
        else {
            console.warn("Cannot lock the camera. Controls for the given camera do not exist.")
        }
    }

    /**
     * Checks if the specified camera is locked.
     * @param camera Queried camera
     * @returns {boolean} True if the camera is locked.
     */
    isCameraLocked(camera) {
        let cameraControls = this._cameraControls[camera._uuid];

        return cameraControls == null || cameraControls.locked;
    }

    /**
     * Checks if the cameras position and rotation are equal to the given position and rotation vector.
     * @param position Position vector
     * @param rotation Rotation vector
     * @returns {*} True if the cameras position and rotation are equal to the specified vectors
     */
    isActiveCameraInPosition(position, rotation) {
        let EPS = 0.0001;
        return this._activeCamera.position.clone().sub(position).length() < EPS && this._activeCamera.rotation.toVector3().clone().sub(rotation).length() < EPS;
    }

    focusCamerasOn(sphere, offsetDir) {

        for (let i = 0; i < this._cameras.length; i++) {
            let controls = this._cameraControls[this._cameras[i]._uuid];

            if (controls != null) {
                controls.focusOn(sphere, offsetDir);
            }
        }
    }

    get activeCamera() { return this._activeCamera; }
    get ownCameras() { return this._cameras; }
    get sharedCameras() { return this._sharedCameras; }
    get aspectTratio() { return this._aspectRatio; }

    set aspectRatio(aspect) { this._aspectRatio = aspect; }
};