#version 300 es
precision mediump float;

uniform mat4 uMVP;

in vec4 aPosition;
in vec2 aTexCoord;
out vec2 vTexCoord;

void main() {
	gl_Position = MVP * aPosition;
}