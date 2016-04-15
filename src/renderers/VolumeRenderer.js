/**
 * Created by Ziga on 25.3.2016.
 */


/**
 * @class VolumeRenderer
 */
M3D.VolumeRenderer = class extends M3D.Renderer {

	constructor(gl) {
		super();

		this.gl = gl;
	}

	render(scene, camera) {
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	}

}