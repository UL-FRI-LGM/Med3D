/**
 * Created by Ziga & Primoz on 1.4.2016.
 */

M3D.PerspectiveCamera = class extends M3D.Camera {

	/**
	 * Creates new PerspectiveCamera object.
	 * @param fov Horizontal field of view given in radians.
	 * @param aspect Aspect ratio (width / height).
	 * @param near Distance to the near clipping plane of the projection camera frustum.
	 * @param far Distance to the far clipping plane of the projection camera frustum.
	 * @constructor
	 * @extends Camera
	 */
	constructor(fov, aspect, near, far) {
		super(M3D.Camera);

		this.type = "PerspectiveCamera";

		this._fov = fov || 1;
		this._aspect = aspect || 1;
		this._near = near || 1;
		this._far = far || 2000;
		this.updateProjectionMatrix();
	}

	/**
	* Updates projection matrix based on current values of properties.
	*/
	updateProjectionMatrix() {
		this._projectionMatrix.makePerspective(this._fov, this._aspect, this._near, this._far);
	}

	get fov() { return this._fov; }
	get aspect() { return this._aspect; }
	get near() { return this._near; }
	get far() { return this._far; }

	set fov(val) {
        if (val !== this._fov) {
            this._fov = val;

            this.updateProjectionMatrix();

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {fov: this._fov}};
                this._onChangeListener.objectUpdate(update)
            }
        }
	}

	set aspect(val) {
        if (val !== this._aspect) {
            this._aspect = val;

            this.updateProjectionMatrix();

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {aspect: this._aspect}};
                this._onChangeListener.objectUpdate(update)
            }
        }
	}

	set near(val) {
        if (val !== this._near) {
            this._near = val;

            this.updateProjectionMatrix();

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {near: this._near}};
                this._onChangeListener.objectUpdate(update)
            }
        }
	}

	set far(val) {
        if (val !== this._far) {
            this._far = val;

            this.updateProjectionMatrix();

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {far: this._far}};
                this._onChangeListener.objectUpdate(update)
            }
        }
	}

	toJson() {
		var obj = super.toJson();

		// Add Perspective camera parameters
		obj.fov = this._fov;
		obj.aspect = this._aspect;
		obj.near = this._near;
		obj.far = this._far;

		return obj;
	}

	static fromJson(data) {
		var camera = new M3D.PerspectiveCamera(data.fov, data.aspect, data.near, data.far);

		return super.fromJson(data, camera);
	}

	update(data) {
		super.update(data);

		var modified = false;
		for (var prop in data) {
			switch (prop) {
				case "fov":
					this._fov = data.fov;
					delete data.fov;
					modified = true;
					break;
				case "aspect":
					this._aspect = data.aspect;
					delete data.aspect;
					modified = true;
					break;
				case "near":
					this._near = data.near;
					delete data.near;
					modified = true;
					break;
				case "far":
					this._far = data.far;
					delete data.far;
					modified = true;
					break;
			}
		}

		// If the camera parameters have been modified update the projection matrix
		if (modified) {
			this.updateProjectionMatrix();
		}
	}
};