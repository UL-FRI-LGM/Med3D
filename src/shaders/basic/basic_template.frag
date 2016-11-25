#version 300 es
precision mediump float;

struct Material {
    vec3 diffuse;
    #if (TEXTURE)
        #if (TEXTURE)
            #for I_TEX in 0 to NUM_TEX
                sampler2D texture##I_TEX;
            #end
        #fi
    #fi
};

uniform Material material;

#if (LIGHTS && !NO_LIGHTS)
    #define MAX_LIGHTS 8

    struct Light {
        bool directional;
        vec3 position;
        vec3 color;
    };

    uniform Light lights[MAX_LIGHTS];
    uniform vec3 ambient;

    in vec3 fragVPos;
#fi

#if (VERTEX_COLORS)
    in vec3 fragVColor;
#fi

#if (TEXTURE)
    in vec2 fragUV;
#fi

out vec4 color;

#if (LIGHTS && !NO_LIGHTS)
    // Calculates the point light color contribution
    vec3 calcPointLight(Light light) {
        // Attenuation
        float distance = length(light.position - fragVPos);
        float attenuation = 1.0f / (1.0f + 0.01f * distance + 0.0001f * (distance * distance));

        // Combine results
        vec3 diffuse = light.color * material.diffuse * attenuation;

        return diffuse;
    }
#fi


void main() {

    #if (LIGHTS && !NO_LIGHTS)
        color = vec4(0.0, 0.0, 0.0, 1.0);

        for (int i = 0; i < MAX_LIGHTS; i++) {
            if (!lights[i].directional) {
                color += vec4(calcPointLight(lights[i]), 0);
            }
            else {
                color += vec4(lights[i].color * material.diffuse, 0);
            }
        }
    #else
        color = vec4(material.diffuse, 1.0);
    #fi

    #if (COLORS)
        color *= vec4(fragVColor, 1.0);
    #fi

    #if (TEXTURE)
        // Apply all of the textures
        #for I_TEX in 0 to NUM_TEX
             color *= texture(material.texture##I_TEX, fragUV);
        #end
    #fi
}