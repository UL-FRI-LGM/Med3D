#version 300 es
precision mediump float;

uniform mat4 uMVP;

in vec4 aPosition;

void main() {
	gl_Position = MVP * aPosition;
}