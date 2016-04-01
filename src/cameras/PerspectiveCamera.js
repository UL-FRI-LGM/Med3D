/**
 * Created by Ziga on 1.4.2016.
 */

M3D.PerspectiveCamera = function(fov, aspect, near, far) {
	M3D.Camera.call(this);
	this.type = 'PerspectiveCamera';

	this.fov = fov;
	this.aspect = aspect;
	this.near = near;
	this.far = far;

	this.updateProjectionMatrix();
}

M3D.PerspectiveCamera.prototype = Object.create(M3D.Camera.prototype);
M3D.PerspectiveCamera.prototype.constructor = M3D.PerspectiveCamera;

M3D.PerspectiveCamera.prototype.updateProjectionMatrix = function() {
	this.projectionMatrix.makePerspective(this.fov, this.aspect, this.near, this.far);
}