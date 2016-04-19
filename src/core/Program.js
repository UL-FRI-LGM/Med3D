/**
 * Created by Ziga on 18.4.2016
 */

M3D.Program = class {
	
	constructor(gl, shaders) {
		this.gl = gl;
		this.uniforms = {};
		this.attributes = {};
		this.program = M3D.createProgram(gl, shaders);
		this.getUniforms();
		this.getAttributes();
	}

	getUniformLocation(name) {
		return gl.getUniformLocation(this.program, name);
	}

	getUniforms() {
		this.uniforms = {};
		var n = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_UNIFORMS);
		for (var i = 0; i < n; i++) {
			var info = this.gl.getActiveUniform(this.program, i);
			var location = this.gl.getUniformLocation(this.program, info.name);
			console.log(location);
			this.uniforms[info.name] = location;
		}
	}

	getAttributes() {
		this.attributes = {};
		var n = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_ATTRIBUTES);
		for (var i = 0; i < n; i++) {
			var info = this.gl.getActiveAttrib(this.program, i);
			this.attributes[info.name] = this.gl.getAttribLocation(this.program, info.name);
		}
	}

	use() {
		this.gl.useProgram(this.program);
	}

}