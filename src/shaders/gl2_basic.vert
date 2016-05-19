#version 300 es
precision mediump float;

uniform mat4 MVMat;
uniform mat4 PMat;

in vec3 VPos;

void main() {
    gl_Position = PMat * MVMat * vec4(VPos, 1.0);
}