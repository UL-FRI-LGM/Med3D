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
	}

	toJson() {
		var obj = super.toJson();

		// Add reference to geometry and material
		obj.geometryUuid = this._geometry._uuid;
		obj.materialUuid = this._material._uuid;

		return obj;
	}

	static fromJson(data, geometry, material) {

		var mesh = new M3D.Mesh(geometry, material);

		// Object3D fromJson
		mesh = super.fromJson(data, mesh);

		return mesh;
	}

	addOnChangeListener(listener, recurse) {
		this._material.onChangeListener = listener;
		this._geometry.onChangeListener = listener;

		super.addOnChangeListener(listener, recurse);
	}

	

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
    

	get modelViewMatrix() { return this._modelViewMatrix; }
	get normalMatrix() { return this._normalMatrix; }
    get material() { return this._material; }
    get geometry() { return this._geometry; }
};