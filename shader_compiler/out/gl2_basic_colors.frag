#version 300 es
precision mediump float;

struct Material {
    vec3 diffuse;
    
};

uniform Material material;




    in vec4 fragVColor;




out vec4 color;




void main() {

    color = vec4(material.diffuse, 1);

    

    
        color *= fragVColor;
    

    
}