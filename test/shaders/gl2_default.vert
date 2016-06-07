#version 300 es
precision mediump float;

uniform mat4 MVP;

in vec4 aPosition;

void main() {
	gl_Position = MVP * aPosition;
}