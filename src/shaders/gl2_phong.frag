#version 300 es
precision mediump float;

// From vertex shader
in vec3 fragPNorm;
in vec3 fragVPos;

out vec4 color;

// Start with basic predefined light
const vec3 ambient = vec3(0.2, 0.0, 0.0);
const vec3 lightPos = vec3(0.0, 0.0, 0.0);
const vec3 diffuseColor = vec3(0.7, 0.0, 0.0);
const vec3 specColor = vec3(1.0, 1.0, 1.0);

void main() {

    vec3 normal = normalize(fragPNorm);
    vec3 lightDir = normalize(lightPos - fragVPos);

    float lambertian = max(dot(lightDir, normal), 0.0);

    // Specular
    vec3 reflectDir = reflect(-lightDir, normal);
    vec3 viewDir = normalize(-fragVPos);

    float lightAngle = max(dot(reflectDir, viewDir), 0.0);
    float specular = pow(lightAngle, 16.0);

    color = vec4(lambertian * diffuseColor + specular * specColor + ambient, 1.0);
}