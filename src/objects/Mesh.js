/**
 * Created by Primoz on 3.4.2016.
 */

M3D.Mesh = class extends M3D.Object3D {

	constructor(geometry, material) {
		super(M3D.Object3D);

		this.type = "Mesh";

		// Model view matrix is derived from the object world matrix and inverse camera world matrix
		this._modelViewMatrix = new THREE.Matrix4();
		this._normalMatrix = new THREE.Matrix3();

		// Each mesh defines geometry and its material
		this._geometry = geometry !== undefined ? geometry : new M3D.Geometry();
		this._material = material !== undefined ? material : new M3D.MeshBasicMaterial( { color: Math.random() * 0xffffff } );

		this.raycast = _raycast;
	}

	addOnChangeListener(listener, recurse) {
		this._material.onChangeListener = listener;
		this._geometry.onChangeListener = listener;

		super.addOnChangeListener(listener, recurse);
	}

	// region GETTERS
	get modelViewMatrix() { return this._modelViewMatrix; }
	get normalMatrix() { return this._normalMatrix; }
	get material() { return this._material; }
	get geometry() { return this._geometry; }
	// endregion

	// region SETTERS
	set modelViewMatrix(mvMat) { this._modelViewMatrix = mvMat; }
	set normalMatrix(normMat) { this._normalMatrix = normMat; }

	// TODO (Primoz): Figure out what to do when material or geometry is changed
    set material(mat) { this._material = mat; }
    set geometry(geom) { this._geometry = geom; }

	set onChangeListener(listener) {
		super.onChangeListener = listener;
		this._geometry.onChangeListener = listener;
		this._material.onChangeListener = listener;
	}
	// endregion


	// region EXPORT/IMPORT
	toJson() {
		var obj = super.toJson();

		// Add reference to geometry and material
		obj.geometryUuid = this._geometry._uuid;
		obj.materialUuid = this._material._uuid;

		return obj;
	}

	static fromJson(data, geometry, material, object) {
		// Create mesh object
		if (!object) {
			var object = new M3D.Mesh(geometry, material);
		}

		// Import Object3D parameters
		object = super.fromJson(data, object);

		return object;
	}
	// endregion
};


let _raycast = (function () {

    let vA = new THREE.Vector3();
    let vB = new THREE.Vector3();
    let vC = new THREE.Vector3();

    let inverseMatrix = new THREE.Matrix4();
    let ray = new THREE.Ray();
    let sphere = new THREE.Sphere();

	// Intersection points
    let intersectionPoint = new THREE.Vector3();
    let intersectionPointWorld = new THREE.Vector3();

	function checkTriangleIntersection( object, raycaster, ray, vertices, a, b, c ) {

		// Fetch triangle vertices
		vA.fromArray(vertices.array, a * 3);
		vB.fromArray(vertices.array, b * 3);
		vC.fromArray(vertices.array, c * 3);

        let intersect;
        let material = object.material;

		// Check triangle intersection
		if (material.side === M3D.BackSide) {
			intersect = ray.intersectTriangle(vC, vB, vA, true, intersectionPoint);
		}
		else {
			intersect = ray.intersectTriangle(vA, vB, vC, material.side !== M3D.FRONT_AND_BACK_SIDE, intersectionPoint);
		}

		// Fallback if no intersection
		if (intersect === null)
			return null;

		// Calculate intersection world position
		intersectionPointWorld.copy(intersectionPoint);
		intersectionPointWorld.applyMatrix4(object.matrixWorld);

		// Get distance to intersection point
        let distance = raycaster.ray.origin.distanceTo(intersectionPointWorld);

		// Check if the distance is out of bounds
		if (distance < raycaster.near || distance > raycaster.far)
			return null;

		// Return intersection object
		return {
			distance: distance,
			point: intersectionPointWorld.clone(),
			triangle: [vA.applyMatrix4(object.matrixWorld).clone(), vB.applyMatrix4(object.matrixWorld).clone(), vC.applyMatrix4(object.matrixWorld).clone()],
			object: object
		};
	}

	return function raycast(raycaster, intersects) {
        let geometry = this.geometry;
        let material = this.material;
        let matrixWorld = this.matrixWorld;

		// Check if object has material
		if (material === undefined || geometry === undefined)
			return;

		// Test bounding sphere
		if (geometry.boundingSphere === null)
			geometry.computeBoundingSphere();

		sphere.copy(geometry.boundingSphere);
		sphere.applyMatrix4(matrixWorld);

		if (raycaster.ray.intersectsSphere(sphere) === false)
			return;


		inverseMatrix.getInverse(matrixWorld);
		ray.copy(raycaster.ray).applyMatrix4(inverseMatrix);

		// Test bounding box
		if (geometry.boundingBox !== null) {
			if (ray.intersectsBox(geometry.boundingBox) === false)
				return;
		}


        let intersection;
        let a, b, c;
        let indices = geometry.indices;
        let vertices = geometry.vertices;

		// Geometry is indexed
		if (indices !== null) {
			for (let i = 0; i < indices.array.length; i += 3) {

				// Triangle indices
				a = indices[i];
				b = indices[i + 1];
				c = indices[i + 2];

				// Test ray intersection with triangle
				intersection = checkTriangleIntersection(this, raycaster, ray, vertices, a, b, c);

				if (intersection) {
					intersection.faceIndex = Math.floor(i / 3); // triangle number in indices buffer semantics
					intersects.push(intersection);
				}
			}
		}
		// Non indexed geometry
		else {
			for (let i = 0; i < geometry.vertices.array.length; i += 9) {

				// Triangle indices
				a = i / 3;
				b = a + 1;
				c = a + 2;

				// Test ray intersection with triangle
				intersection = checkTriangleIntersection(this, raycaster, ray, vertices, a, b, c);

				if (intersection) {
					intersection.index = a; // triangle number in positions buffer semantics
					intersects.push(intersection);
				}
			}
		}
	}
})();