/**
 * Created by Ziga on 25.3.2016.
 */

M3D.Object3D = class {

	constructor() {

		// Self reference for callbacks
		var self = this;

		// Unique identifier
		this._uuid = THREE.Math.generateUUID();
		this.type = "Object3D";

		this._parent = null;
		this._children = [];

		this._position = new THREE.Vector3();
		this._rotation = new THREE.Euler();
		this._quaternion = new THREE.Quaternion();
		this._scale = new THREE.Vector3(1, 1, 1);

		function onRotationChange() {
			self.quaternion.setFromEuler(self.rotation, false);
		}

		function onQuaternionChange() {
			self.rotation.setFromQuaternion(self.quaternion, undefined, false);
		}

		this._rotation.onChange(onRotationChange);
		this._quaternion.onChange(onQuaternionChange);


		this._matrix = new THREE.Matrix4();
		this._matrixWorld = new THREE.Matrix4();
		this._matrixWorldNeedsUpdate = false;

		this._matrixAutoUpdate = true;

		this._onChangeListener = null;

		// References to static functions
		this.rotateOnAxis = rotateOnAxis;
		this.rotateX = rotateX;
		this.rotateY = rotateY;
		this.rotateZ = rotateZ;
        this.lookAt = lookAt;

		this.translateOnAxis = translateOnAxis;
		this.translateX = translateX;
		this.translateY = translateY;
		this.translateZ = translateZ;
	}

    //region GETTERS
    get parent() { return this._parent; }
    get children() { return this._children; }

    get position() { return this._position; }
    get rotation() { return this._rotation; }
    get quaternion() { return this._quaternion; }
    get scale() { return this._scale; }
    get matrixAutoUpdate() { return this._matrixAutoUpdate; }
    get matrixWorld() { return this._matrixWorld; }
    //endregion

    //region SETTERS
    set position(vec) {
        if (!vec.equals(this._position)) {
            this._position.copy(vec);

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {position: this._position.toArray()}};
                this._onChangeListener.objectUpdate(update)
            }
        }
    }

    set positionX(val) {
        if (this._position.x !== val) {
            this._position.x = val;

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {position: this._position.toArray()}};
                this._onChangeListener.objectUpdate(update)
            }
        }
    }

    set positionY(val) {
        if (this._position.y !== val) {
            this._position.y = val;

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {position: this._position.toArray()}};
                this._onChangeListener.objectUpdate(update)
            }
        }
    }

    set positionZ(val) {
        if (this._position.z !== val) {
            this._position.z = val;

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {position: this._position.toArray()}};
                this._onChangeListener.objectUpdate(update)
            }
        }
    }

    set rotation(euler) {
        if (!euler.equals(this._rotation)) {
            this._rotation.copy(euler);

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {quaternion: this._quaternion.toArray()}};
                this._onChangeListener.objectUpdate(update)
            }
        }
    }

    set quaternion(quat) {
        if (!quat.equals(this._quaternion)) {
            this._quaternion.copy(quat);

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {quaternion: this._quaternion.toArray()}};
                this._onChangeListener.objectUpdate(update)
            }
        }
    }

    set scale(vec) {
        if (!vec.equals(this._scale)) {
            this._scale = vec;

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {scale: this._scale.toArray()}};
                this._onChangeListener.objectUpdate(update)
            }
        }
    }

    set matrixAutoUpdate(val) {
        if (matrixAutoUpdate !== this._matrixAutoUpdate) {
            this._matrixAutoUpdate = val;

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {matrixAutoUpdate: this._matrixAutoUpdate}};
                this._onChangeListener.objectUpdate(update)
            }
        }
    }

    addOnChangeListener(listener, recurse) {
        this._onChangeListener = listener;

        if (recurse) {
            for (var i = 0; i < this._children.length; i++) {
                this._children[i].addOnChangeListener(listener, recurse);
            }
        }
    }
    //endregion

    //region MATRIX UPDATING
	applyMatrix(matrix) {
		this._matrix.multiplyMatrices(matrix, this._matrix);
		this._matrix.decompose(this._position, this._quaternion, this._scale);

        // Notify onChange subscriber
        if (this._onChangeListener) {
            var update = {uuid: this._uuid, changes: {position: this._position.toArray(), quaternion: this._quaternion.toArray(), scale: this._scale.toArray(), matrix: this._matrix.toArray()}};
            this._onChangeListener.objectUpdate(update)
        }
	}

	updateMatrix() {
		this._matrix.compose(this._position, this._quaternion, this._scale);
		this._matrixWorldNeedsUpdate = true;
	}

	updateMatrixWorld() {
		if ( this._matrixAutoUpdate === true ) this.updateMatrix();

		if (this._matrixWorldNeedsUpdate) {
			if (this.parent === null) {
				this._matrixWorld.copy(this._matrix);
			} else {
				this._matrixWorld.multiplyMatrices(this.parent._matrixWorld, this._matrix);
			}
			this._matrixWorldNeedsUpdate = false;
		}

		for (var i = 0; i < this.children.length; i++) {
			this.children[i].updateMatrixWorld();
		}
	}
    //endregion

    //region HIERARCHY FUNCTIONS
	add(object) {
		if (object === this) {
			return;
		}
		if (object._parent !== null) {
			object._parent.remove(object);
		}

		object._parent = this;
		this._children.push(object);

        // Notify onChange subscriber
        if (this._onChangeListener) {
            object.onChangeListener = this._onChangeListener;
            var update = {uuid: object._uuid, changes: {parentUuid: this._uuid, objectRef: object}};
            this._onChangeListener.hierarchyUpdate(update)
        }
	}

	remove(object) {
		var index = this._children.indexOf(object);
		if (index !== -1) {
			object._parent = null;
			this._children.splice(index, 1);

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: object._uuid, changes: {parentUuid: null}};
                this._onChangeListener.hierarchyUpdate(update)
            }
		}
	}

	traverse(callback) {
		callback(this);
		for (var i = 0, l = this._children.length; i < l; i++) {
			this._children[i].traverse(callback);
		}
	}
    //endregion

    //region EXPORT/IMPORT JSON FUNCTIONS
	toJson() {
		var obj = {};

		obj.uuid = this._uuid;
		obj.type = this.type;

        if (this._parent) {
            obj.parentUuid = this._parent._uuid;
        }

		obj.position = this._position.toArray();
		obj.quaternion = this._quaternion.toArray();
		obj.scale = this._scale.toArray();

        obj.matrix = this._matrix.toArray();
		obj.matrixAutoUpdate = this._matrixAutoUpdate;

		return obj;
	}

	exportHierarchyToJson(result) {
		// If this is the first call in the recursion.. initialise the result objects
		if (!result.objects || !result.geometries || !result.materials) {
			result.objects = {};
			result.geometries = {};
			result.materials = {};
		}

		// Call Json export function
		var obj = this.toJson();

		result.objects[obj.uuid] = obj;

		// If instance of mesh also add the reference _uuid to geometry and material
		if (this.type === "Mesh") {
			result.geometries[this._geometry._uuid] = this._geometry.toJson();
			result.materials[this._material._uuid] = this._material.toJson();
		}

		// Recurse
		for (var i = 0; i < this.children.length; i++) {
			this.children[i].exportHierarchyToJson(result);
		}
	}

    static fromJson(data, object) {

        if (!object) {
            var object = new M3D.Object3D();
        }

        object._uuid = data.uuid;

        object._position.fromArray(data.position);
        object._quaternion.fromArray(data.quaternion);
        object._scale.fromArray(data.scale);

        object._matrix.set(data.matrix);
        // World matrix needs to be updated
        object._matrixWorldNeedsUpdate = true;
        object._matrixAutoUpdate = data.matrixAutoUpdate;

        return object;
    }

    static importHierarchy(objects, geometries, materials) {
        var rebuiltObjects = {};

        // Rebuild the objects
        for (var uuid of Object.keys(objects)) {
            var obj = objects[uuid];

            switch (obj.type) {
                case "Mesh":
                    var geometry = geometries[obj.geometryUuid];
                    var material = materials[obj.materialUuid];

                    if (geometry) {
                        geometry = M3D.Geometry.fromJson(geometry);
                    }
                    else {
                        geometry = undefined;
                        console.warn("Could not find geometry for the mesh: " + obj.uuid);
                    }

                    if (material) {
                        switch (material.type) {
                            case "Material":
                                material = M3D.Material.fromJson(material);
                                break;
                            case "MeshBasicMaterial":
                                material = M3D.MeshBasicMaterial.fromJson(material);
                                break;
                            case "MeshPhongMaterial":
                                material = M3D.MeshPhongMaterial.fromJson(material);
                                break;
                            default:
                                material = undefined;
                        }
                    }
                    else {
                        material = undefined;
                        console.warn("Could not find material for the mesh: " + obj.uuid);
                    }

                    rebuiltObjects[obj.uuid] = M3D.Mesh.fromJson(obj, geometry, material);
                    break;
                default:
                    rebuiltObjects[obj.uuid] = M3D[obj.type].fromJson(obj);
                    break;
            }
        }

        var rootObjects = [];

        // Rebuild the hierarchy
        for (var uuid of Object.keys(objects)) {
            var obj = rebuiltObjects[uuid];
            var parentUuid = objects[uuid].parentUuid;

            if (!parentUuid) {
                rootObjects.push(obj);
            }
            else {
                var parent = rebuiltObjects[parentUuid];

                if (parent) {
                    obj._parent = parent;
                    parent.children.push(obj);
                }
                else {
                    rootObjects.push(parent);
                }
            }
        }

        return rootObjects;
    }

    update(data) {
        for (var prop in data) {
            switch (prop) {
                case "position":
                    this._position.fromArray(data.position);
                    delete data.position;
                    break;
                case "quaternion":
                    this._quaternion.fromArray(data.quaternion);
                    delete data.quaternion;
                    break;
                case "scale":
                    this._scale.fromArray(data.scale);
                    delete data.scale;
                    break;
                case "matrix":
                    this._matrix.fromArray(data.matrix);
                    this._matrixWorldNeedsUpdate = true;
                    delete data.matrix;
                    break;
                case "matrixAutoUpdate":
                    this._matrixAutoUpdate = data.matrixAutoUpdate;
                    delete data.matrixAutoUpdate;
                    break;
            }
        }
    }
    //endregion
};

//region STATIC TRANSLATION FUNCTIONS
/**
 * Incrementally rotates the object via quaternion in the given axis for the rotation angle.
 * @param {THREE.Vector3} axis A normalized 3D vector in space
 * @param angle The angle in radians.
 */
var rotateOnAxis = (function() {
	// Private static quaternion
	var q1 = new THREE.Quaternion();

	return function (axis, angle) {
        if (angle !== 0) {
            q1.setFromAxisAngle(axis, angle);
            this._quaternion.multiply(q1);

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {quaternion: this._quaternion.toArray()}};
                this._onChangeListener.objectUpdate(update)
            }

            return this;
        }
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

var lookAt = (function () {
    // Private static
    var m = new THREE.Matrix4();
    var q = new THREE.Quaternion();

    return function(vector, up) {
        m.lookAt(this._position, vector, up);
        q.setFromRotationMatrix(m);

        if (!q.equals(this._quaternion)) {
            this._quaternion.copy(q);

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {quaternion: this._quaternion.toArray()}};
                this._onChangeListener.objectUpdate(update)
            }
        }
    }
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
        if (distance !== 0) {
            v1.copy(axis).applyQuaternion(this._quaternion);

            this._position.add(v1.multiplyScalar(distance));

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {position: this._position.toArray()}};
                this._onChangeListener.objectUpdate(update)
            }
        }

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
//endregion
