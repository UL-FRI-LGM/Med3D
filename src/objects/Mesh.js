/**
 * Created by Primoz on 3.4.2016.
 */

M3D.Mesh = class extends Object3D {

	constructor(geometry, material) {
		this.type = 'Mesh';

		// Each mesh defines geometry and its material
		this.geometry = geometry !== undefined ? geometry : new M3D.BufferGeometry();
		this.material = material !== undefined ? material : new M3D.MeshBasicMaterial( { color: Math.random() * 0xffffff } );
	}

};