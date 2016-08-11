#version 300 es
precision mediump float;

struct Material {
    vec3 diffuse;
    
        sampler2D texture;
    
};

uniform Material material;


    #define MAX_LIGHTS 8

    struct Light {
        bool directional;
        vec3 position;
        vec3 color;
    };

    uniform Light lights[MAX_LIGHTS];
    uniform vec3 ambient;

    in vec3 fragVPos;



    in vec4 fragVColor;



    in vec2 fragUV;


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

    color = vec4(material.diffuse, 1);

    
        for (int i = 0; i < MAX_LIGHTS; i++) {
            if (!lights[i].directional) {
                color += vec4(calcPointLight(lights[i]), 1);
            }
            else {
                color += vec4(lights[i].color * material.diffuse, 1);
            }
        }
    

    
        color *= fragVColor;
    

    
        color *= texture(material.texture, fragUV);
    
}