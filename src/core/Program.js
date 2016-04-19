/**
 * Created by Ziga on 18.4.2016
 */

M3D.Program = class {
	
	constructor(gl, shaders) {
		this.gl = gl;
		this.uniforms = {};
		this.attributes = {};
		this.program = M3D.createProgram(gl, shaders);
	}

	getUniformLocation(name) {
		return gl.getUniformLocation(this.program, name);
	}

	getUniforms() {
		this.uniforms = {};
		var n = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
		for (var i = 0; i < n; i++) {
			var info = gl.getActiveUniform(this.program, i);
			var location = gl.getUniformLocation(this.program, info.name);
			this.uniforms[info.name] = location;
		}
	}

	getAttributes() {
		this.attributes = {};
		var n = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
		for (var i = 0; i < n; i++) {
			var info = gl.getActiveAttrib(this.program, i);
			this.attributes[info.name] = gl.getAttribLocation(this.program, info.name);
		}
	}

	use() {
		this.gl.useProgram(this.program);
	}

}