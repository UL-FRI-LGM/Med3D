/**
 * Created by Ziga on 25.3.2016.
 */

M3D.Object3D = class {

	constructor() {
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
		this.matrixWorldNeedsUpdate = false;

		this.visible = true;
	}

	applyMatrix(matrix) {
		this.matrix.multiplyMatrices(matrix, this.matrix);
		this.matrix.decompose(this.position, this.quaternion, this.scale);
	}

	updateMatrix() {
		this.matrix.compose(this.position, this.quaternion, this.scale);
		this.matrixWorldNeedsUpdate = true;
	}

	updateMatrixWorld(force) {
		if (this.matrixWorldNeedsUpdate === true) {
			if (this.parent === null) {
				this.matrixWorld.copy(this.matrix);
			} else {
				this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
			}
			this.matrixWorldNeedsUpdate = false;
			force = true;
		}
		for (var i = 0; i < this.children.length; i++) {
			this.children[i].updateMatrixWorld(force);
		}
	}

	lookAt(vector, up) {
		var m = new THREE.Matrix4();
		m.lookAt(vector, this.position, up);
		this.quaternion.setFromRotationMatrix(m);
	}

	add(object) {
		if (object === this) {
			return;
		}
		if (object.parent !== null) {
			object.parent.remove(object);
			object.parent = this;
			this.children.push(object);
		}
	}

	remove(object) {
		var index = this.children.indexOf(object);
		if (index !== -1) {
			object.parent = null;
			this.children.splice(index, 1);
		}
	}

	traverse(callback) {
		callback(this);
		for (var i = 0, l = this.children.length; i < l; i++) {
			this.children[i].traverse(callback);
		}
	}

	// TODO: functions: transformations
	
}