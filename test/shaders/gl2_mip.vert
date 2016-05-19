#version 300 es
precision mediump float;

in vec4 aPosition;
out vec2 vFragCoord;

void main() {
	gl_Position = aPosition;
	vFragCoord = aPosition.xy;
}