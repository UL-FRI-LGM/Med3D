/**
 * Created by Ziga on 25.3.2016.
 */

 // TODO - Primoz: zmergej z GLManager.js

M3D.createWebGLContext = function(canvas) {
	var context = null;
	var names = ["webgl", "experimental-webgl"];
	for (var i = 0; i < names.length; i++) {
		try {
			context = canvas.getContext(names[i]);
		} catch (e) {
		}
		if (context) {
			break;
		}
	}
	return context;
}

M3D.createWebGL2Context = function(canvas) {
	var context = null;
	var names = ["webgl2", "experimental-webgl2"];
	for (var i = 0; i < names.length; i++) {
		try {
			context = canvas.getContext(names[i]);
		} catch (e) {
		}
		if (context) {
			break;
		}
	}
	return context;
}

M3D.createShader = function(gl, source, type) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	var status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (!status) {
		console.error(gl.getShaderInfoLog(shader));
	}
	return shader;
}

M3D.createProgram = function(gl, shaders) {
	var program = gl.createProgram();
	for (var i = 0; i < shaders.length; i++) {
		gl.attachShader(program, shaders[i]);
	}
	gl.linkProgram(program);
	var status = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (!status) {
		console.error(gl.getProgramInfoLog(program));
	}
	for (var i = 0; i < shaders.length; i++) {
		gl.deleteShader(shaders[i]);
	}
	return program;
}

M3D.shaderTypeFromString = function(gl, string) {
	switch(string) {
		case "vertex": return gl.VERTEX_SHADER;
		case "fragment": return gl.FRAGMENT_SHADER;
		default:
			console.error("Unknown shader type: " + string);
			return null;
	}
}