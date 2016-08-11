#version 300 es
precision mediump float;

struct Material {
    vec3 diffuse;
    #if (TEXTURE)
        sampler2D texture;
    #fi
};

uniform Material material;

#if (LIGHTS)
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

#if (COLORS)
    in vec4 fragVColor;
#fi

#if (TEXTURE)
    in vec2 fragUV;
#fi

out vec4 color;

#if (LIGHTS)
    // Calculates the point light color contribution
    vec3 calcPointLight(Light light) {
        // Attenuation
        float distance = length(light.position - fragVPos);
        float attenuation = 1.0f / (1.0f + 0.1f * distance + 0.01f * (distance * distance));

        // Combine results
        vec3 diffuse = light.color * material.diffuse * attenuation;

        return diffuse;
    }
#fi


void main() {

    color = vec4(material.diffuse, 1);

    #if (LIGHTS)
        for (int i = 0; i < MAX_LIGHTS; i++) {
            if (!lights[i].directional) {
                color += vec4(calcPointLight(lights[i]), 1);
            }
            else {
                color += vec4(lights[i].color * material.diffuse, 1);
            }
        }
    #fi

    #if (COLORS)
        color *= fragVColor;
    #fi

    #if (TEXTURE)
        color * texture(material.texture, fragUV);
    #fi
}