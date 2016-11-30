#version 300 es
precision highp float;

struct Material {
    #if (TEXTURE)
        #for I_TEX in 0 to NUM_TEX
            sampler2D texture##I_TEX;
        #end
    #fi
};

uniform Material material;

uniform bool mouseDown;
uniform vec2 mousePos;

#if (TEXTURE)
    in vec2 fragUV;
#fi

out vec4 color;


void main() {
    #if (TEXTURE)
        vec4 drawTexture = texture(material.texture0, fragUV).rgba;

        float dist = distance(fragUV, mousePos);

        color = vec4(0.0f, 0.0f, 0.0f, 0.0f);

        if (mouseDown && dist < 0.005f) {
            color.r = 1.0f;
            color.a = 1.0f - (dist / 0.005f);
        }
    #fi
}