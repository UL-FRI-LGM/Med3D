/**
 * Created by Ziga on 1.4.2016.
 */

M3D.PerspectiveCamera = class extends M3D.Camera {

	constructor(fov, aspect, near, far) {
		super();

		this.fov = fov || 1;
		this.aspect = aspect || 1;
		this.near = near || 0.1;
		this.far = far || 1000;

		this.updateProjectionMatrix();
	}

	updateProjectionMatrix() {
		this.projectionMatrix.makePerspective(this.fov, this.aspect, this.near, this.far);
	}

}