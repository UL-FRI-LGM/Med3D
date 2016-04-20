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
		createQuad();
	}

	render(volume, camera) {
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		camera.updateMatrixWorld();
		camera.matrixWorldInverse.getInverse(camera.matrixWorld);
		var VP = camera.projectionMatrix.clone();
		VP.multiply(camera.matrixWorldInverse);

		// get model transformation
		// draw volume
	}

	createQuad() {
		var gl = this.gl;

		// create vertex buffer
		if (this.VBO === undefined) {
			var vbodata = new Float32Array([
				-1.0, -1.0,
				 1.0, -1.0,
				-1.0,  1.0,
				 1.0,  1.0
			]);
			var vbo = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
			gl.bufferData(gl.ARRAY_BUFFER, vbodata, gl.STATIC_DRAW);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
		}

		// create index buffer
		if (this.IBO === undefined) {
			var ibodata = new Uint16Array([
				0, 1, 2,
				1, 2, 3
			]);
			var ibo = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ibodata, gl.STATIC_DRAW);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		}
	}

}