/**
 * Created by Ziga on 25.3.2016.
 */

M3D.Camera = function () {
	M3D.Object3D.call(this);
	this.type = 'Camera';

	this.matrixWorldInverse = new THREE.Matrix4();
	this.projectionMatrix = new THREE.Matrix4();
}

M3D.Camera.prototype = Object.create(M3D.Object3D.prototype);
M3D.Camera.prototype.constructor = M3D.Camera;