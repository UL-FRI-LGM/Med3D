/**
 * Created by Ziga on 25.3.2016.
 */

M3D.Object3D = function () {
	this.type = 'Object3D';

	this.parent = null;
	this.children = [];

	this.position = new THREE.Vector3();
	this.rotation = new THREE.Euler();
	this.quaternion = new THREE.Quaternion();
	this.scale = new THREE.Vector3(1, 1, 1);

	function onRotationChange() {
		this.quaternion.setFromEuler(rotation, false);
	}

	function onQuaternionChange() {
		this.rotation.setFromQuaternion(quaternion, undefined, false);
	}

	this.rotation.onChange(onRotationChange);
	this.quaternion.onChange(onQuaternionChange);

	this.matrix = new THREE.Matrix4();
	this.matrixWorld = new THREE.Matrix4();

	this.visible = true;
}

M3D.Object3D.prototype = {

	constructor: M3D.Object3D,

	applyMatrix: function(matrix) {
		this.matrix.multiplyMatrices(matrix, this.matrix);
		this.matrix.decompose(this.position, this.quaternion, this.scale);
	}

	// TODO: add relevant methods

}