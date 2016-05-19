#version 300 es
precision mediump float;

uniform mat4 MVMat; // Model View Matrix
uniform mat4 PMat;  // Projection Matrix
uniform mat4 NMat;  // Normal Matrix

in vec3 VPos;       // Vertex position
in vec3 PNorm;      // Plane normal

// Output transformed vertex and plane normal
out vec3 fragPNorm;
out vec3 fragVPos;

void main() {
    gl_Position = PMat * MVMat * vec4(VPos, 1.0);

    // Transform vertex and plane normal
    vec4 VPos4 = MVMat * vec4(VPos, 1.0);
    fragVPos = vec3(VPos4) / VPos4.w;
    fragPNorm = vec3(NMat * vec4(PNorm, 0.0));
}