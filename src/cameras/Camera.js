/**
 * Created by Ziga on 25.3.2016.
 */

M3D.Camera = class extends M3D.Object3D {

	constructor() {
		super();

		this.matrixWorldInverse = new THREE.Matrix4();
		this.projectionMatrix = new THREE.Matrix4();
	}

}