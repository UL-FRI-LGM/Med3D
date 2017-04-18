/**
 * Created by Ziga on 20.4.2016.
 */

M3D.Volume = class extends M3D.Object3D {

	constructor(data, dimensions) {
		super();

		this.dimensions = dimensions;
		this.data = data;
		this.color = new THREE.Color(0x00ff00);

		this._material = new M3D.VolumeBasicMaterial();
	}

	get material() { return this._material; }
};