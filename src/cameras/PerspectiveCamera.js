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

		this.fov = fov || 1;
		this.aspect = aspect || 1;
		this.near = near || 1;
		this.far = far || 2000;
		this.updateProjectionMatrix();
	}

	/**
	* Updates projection matrix based on current values of properties.
	*/
	updateProjectionMatrix() {
		this._projectionMatrix.makePerspective(this.fov, this.aspect, this.near, this.far);
	}


};