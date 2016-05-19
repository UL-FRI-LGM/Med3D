/**
 * Created by Ziga on 25.3.2016.
 */

M3D.Object3D = class {

	constructor() {

		// TODO - Ziga: Preveri ce copiler to dela avtomatsko
		// Self reference for callbacks
		var self = this;

		this.parent = null;
		this.children = [];

		this.position = new THREE.Vector3();
		this.rotation = new THREE.Euler();
		this.quaternion = new THREE.Quaternion();
		this.scale = new THREE.Vector3(1, 1, 1);

		function onRotationChange() {
			self.quaternion.setFromEuler(rotation, false);
		}

		function onQuaternionChange() {
			self.rotation.setFromQuaternion(quaternion, undefined, false);
		}

		this.rotation.onChange(onRotationChange);
		this.quaternion.onChange(onQuaternionChange);

		this.matrix = new THREE.Matrix4();
		this.matrixWorld = new THREE.Matrix4();
		this.matrixWorldNeedsUpdate = false;

		this.visible = true;

		// References to static functions
		this.rotateOnAxis = rotateOnAxis;
		this.rotateX = rotateX;
		this.rotateY = rotateY;
		this.rotateZ = rotateZ;

		this.translateOnAxis = translateOnAxis;
		this.translateX = translateX;
		this.translateY = translateY;
		this.translateZ = translateZ;
	}

	applyMatrix(matrix) {
		this.matrix.multiplyMatrices(matrix, this.matrix);
		this.matrix.decompose(this.position, this.quaternion, this.scale);
	}

	updateMatrix() {
		this.matrix.compose(this.position, this.quaternion, this.scale);
		this.matrixWorldNeedsUpdate = true;
	}

	// TODO - Ziga: FIX force :)
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
		}

		object.parent = this;
		this.children.push(object);
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
};


/**
 * Incrementally rotates the object via quaternion in the given axis for the rotation angle.
 * @param {THREE.Vector3} axis A normalized 3D vector in space
 * @param angle The angle in radians.
 */
var rotateOnAxis = (function() {
	// Private static quaternion
	var q1 = new THREE.Quaternion();

	return function (axis, angle) {
		q1.setFromAxisAngle(axis, angle);
		this.quaternion.multiply(q1);

		return this;
	};
})();

/**
 * Incrementally rotates the object in X axis for the given angle.
 * @param angle The angle in radians
 */
var rotateX = (function() {
	// Private static axis vector
	var v1 = new THREE.Vector3(1, 0, 0);

	return function (angle) {
		return this.rotateOnAxis(v1, angle);
	};
})();


/**
 * Incrementally rotates the object in Y axis for the given angle.
 * @param angle The angle in radians
 */
var rotateY = (function() {
	// Private static axis vector
	var v1 = new THREE.Vector3(0, 1, 0);

	return function (angle) {
		return this.rotateOnAxis(v1, angle);
	};
})();

/**
 * Incrementally rotates the object in Z axis for the given angle.
 * @param angle The angle in radians
 */
var rotateZ = (function () {
	// Private static axis vector
	var v1 = new THREE.Vector3(0, 0, 1);

	return function (angle) {
		return this.rotateOnAxis(v1, angle);
	};
})();


/**
 * Translates an object by distance along an axis in object space.
 * @param {THREE.Vector3} axis A normalized 3D vector in space
 * @param distance The distance to translate.
 */
var translateOnAxis = (function () {

	// translate object by distance along axis in object space
	// axis is assumed to be normalized

	var v1 = new THREE.Vector3();

	return function (axis, distance) {

		v1.copy(axis).applyQuaternion(this.quaternion);

		this.position.add(v1.multiplyScalar(distance));

		return this;
	};
})();

/**
 * Translates an object by distance along axis X in object space.
 * @param distance The distance to translate.
 */
var translateX = (function () {
	// Private axis vector
	var v1 = new THREE.Vector3( 1, 0, 0 );

	return function (distance) {
		return this.translateOnAxis(v1, distance);
	};
})();

/**
 * Translates an object by distance along axis Y in object space.
 * @param distance The distance to translate.
 */
var translateY = (function () {
	// Private axis vector
	var v1 = new THREE.Vector3( 0, 1, 0 );

	return function (distance) {
		return this.translateOnAxis(v1, distance);
	};
})();

/**
 * Translates an object by distance along axis Z in object space.
 * @param distance The distance to translate.
 */
var translateZ = (function () {
	// Private axis vector
	var v1 = new THREE.Vector3(0, 0, 1);

	return function (distance) {
		return this.translateOnAxis(v1, distance);
	};
})();
	
