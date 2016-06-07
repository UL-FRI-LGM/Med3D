/**
 * Created by Primoz on 3.4.2016.
 */


// TODO - Primoz: Dodaj normalizeNormals, computeVertexNormals
M3D.Mesh = class extends M3D.Object3D {

	constructor(geometry, material) {
		super(M3D.Object3D);

		// Model view matrix is derived from the object world matrix and inverse camera world matrix
		this._modelViewMatrix = new THREE.Matrix4();
		this._normalMatrix = new THREE.Matrix3();

		// Each mesh defines geometry and its material
		this._geometry = geometry !== undefined ? geometry : new M3D.Geometry();
		this._material = material !== undefined ? material : new M3D.MeshBasicMaterial( { color: Math.random() * 0xffffff } );
	}
	
	

	set modelViewMatrix(mvMat) { this._modelViewMatrix = mvMat; }
	set normalMatrix(normMat) { this._normalMatrix = normMat; }
    set material(mat) { this._material = mat; }
    set geometry(geom) { this._geometry = geom; }
    

	get modelViewMatrix() { return this._modelViewMatrix; }
	get normalMatrix() { return this._normalMatrix; }
    get material() { return this._material; }
    get geometry() { return this._geometry; }
};