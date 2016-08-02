#version 300 es
precision mediump float;

struct Material {
    vec3 diffuse;
    sampler2D texture;
};

uniform Material material;

// From vertex shader
in vec2 fragUV;

out vec4 color;

void main() {
    color = vec4(material.diffuse, 1.0) * texture(material.texture, fragUV);
}
