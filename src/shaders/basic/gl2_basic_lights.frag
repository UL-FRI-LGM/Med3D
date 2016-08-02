#version 300 es
precision mediump float;

#define MAX_LIGHTS 8

struct Light {
    bool directional;
    vec3 position;
    vec3 color;
};

struct Material {
    vec3 diffuse;
};

uniform Light lights[MAX_LIGHTS];
uniform vec3 ambient;
uniform Material material;

// From vertex shader
in vec3 fragVPos;

out vec4 color;

// Calculates the point light color contribution
vec3 calcPointLight(Light light) {
    // Attenuation
    float distance = length(light.position - fragVPos);
    float attenuation = 1.0f / (1.0f + 0.1f * distance + 0.01f * (distance * distance));

    // Combine results
    vec3 diffuse = light.color * material.diffuse * attenuation;

    return diffuse;
}


void main() {

    // Calculate combined light contribution
    vec3 combined = ambient;

    for (int i = 0; i < MAX_LIGHTS; i++) {
        if (!lights[i].directional) {
            combined += calcPointLight(lights[i]);
        }
        else {
            combined += lights[i].color * material.diffuse;
        }
    }

    color = vec4(combined, 1.0);
}