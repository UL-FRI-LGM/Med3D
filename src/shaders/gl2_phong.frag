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
    vec3 specular;
    float shininess;
};

uniform Light lights[MAX_LIGHTS];
uniform vec3 ambient;
uniform Material material;

// From vertex shader
in vec3 fragVNorm;
in vec3 fragVPos;

out vec4 color;

// Calculates the point light color contribution
vec3 calcPointLight (Light light, vec3 normal, vec3 viewDir) {

    vec3 lightDir = normalize(light.position - fragVPos);

    // Difuse
    float diffuseF = max(dot(normal, lightDir), 0.0f);

    // Specular
    vec3 reflectDir = reflect(-lightDir, normal);
    float specularF = pow(max(dot(viewDir, reflectDir), 0.0f), material.shininess);

    // Attenuation
    float distance = length(light.position - fragVPos);
    float attenuation = 1.0f / (1.0f + 0.1f * distance + 0.1f * (distance * distance));

    // Combine results
    vec3 diffuse  = light.color * diffuseF  * material.diffuse  * attenuation;
    vec3 specular = light.color * specularF * material.specular * attenuation;

    return (diffuse + specular);
}

vec3 calcDirectLight (Light light, vec3 normal, vec3 viewDir) {

    vec3 lightDir = normalize(light.position);

    // Difuse
    float diffuseF = max(dot(normal, lightDir), 0.0f);

    // Specular
    vec3 reflectDir = reflect(-lightDir, normal);
    float specularF = pow(max(dot(viewDir, reflectDir), 0.0f), material.shininess);

    // Combine results
    vec3 diffuse  = light.color  * diffuseF * material.diffuse;
    vec3 specular = light.color * specularF * material.specular;

    return (diffuse + specular);
}

void main() {
    vec3 normal = normalize(fragVNorm);
    vec3 viewDir = normalize(-fragVPos);

    // Calculate combined light contribution
    vec3 combined = ambient;

    for (int i = 0; i < MAX_LIGHTS; i++) {
        if (!lights[i].directional) {
            combined += calcPointLight(lights[i], normal, viewDir);
        }
        else {
            combined += calcDirectLight(lights[i], normal, viewDir);
        }
    }

    color = vec4(combined, 1.0);
}