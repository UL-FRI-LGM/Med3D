/**
 * Created by Primoz on 3.4.2016.
 */


// TODO - Primoz: Dodaj normalizeNormals, computeVertexNormals
M3D.Mesh = class extends Object3D {

	constructor(geometry, material) {
		this.normalMatrix = new THREE.Matrix3();

		// Each mesh defines geometry and its material
		this.geometry = geometry !== undefined ? geometry : new M3D.BufferGeometry();
		this.material = material !== undefined ? material : new M3D.MeshBasicMaterial( { color: Math.random() * 0xffffff } );


		// TODO - Primoz: FIX - vključitev v Mesh
		// List of required programs to render this object
		this.requiredPrograms = [];
		this.programsDirty = false;
	}

};