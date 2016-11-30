#version 300 es
precision mediump float;

struct Light {
    bool directional;
    vec3 position;
    vec3 color;
};

struct Material {
    vec3 diffuse;
    vec3 specular;
    float shininess;

    #if (TEXTURE)
        #for I_TEX in 0 to NUM_TEX
            sampler2D texture##I_TEX;
        #end
    #fi
};

#if (!NO_LIGHTS)
uniform Light lights[##NUM_LIGHTS];
#fi

uniform vec3 ambient;
uniform Material material;

// From vertex shader
in vec3 fragVNorm;
in vec3 fragVPos;

#if (TEXTURE)
    in vec2 fragUV;
#fi

out vec4 color[3];

// Calculates the point light color contribution
vec3 calcPointLight (Light light, vec3 normal, vec3 viewDir) {

    vec3 lightDir = normalize(light.position - fragVPos);

    // Difuse
    float diffuseF = max(dot(lightDir, normal), 0.0f);

    // Specular
    vec3 reflectDir = reflect(-lightDir, normal);
    float specularF = pow(max(dot(viewDir, reflectDir), 0.0f), material.shininess);

    // Attenuation
    float distance = length(light.position - fragVPos);
    float attenuation = 1.0f / (1.0f + 0.01f * distance + 0.0001f * (distance * distance));

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

    #if (!NO_LIGHTS)
        #for lightIdx in 0 to NUM_LIGHTS
            if (!lights[##lightIdx].directional) {
                combined += calcPointLight(lights[##lightIdx], normal, viewDir);
            }
            else {
                combined += calcDirectLight(lights[##lightIdx], normal, viewDir);
            }
        #end
    #fi

    color[0] = vec4(combined, 1.0);

    #if (TEXTURE)
        // Apply all of the textures
        #for I_TEX in 0 to NUM_TEX
             color[0] *= texture(material.texture##I_TEX, fragUV);
        #end

    #fi

    color[1] = vec4(normal, 1.0);
    color[2] = vec4(abs(fragVPos), 1.0);
}