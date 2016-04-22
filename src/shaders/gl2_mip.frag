#version 300 es
precision mediump float;

uniform mat4 uMVP;
uniform mediump sampler3D uVolume;

in vec2 vFragCoord;
out vec4 color;

void main() {
	color = vec4(vFragCoord.x, vFragCoord.y, 0.0, 1.0);
}