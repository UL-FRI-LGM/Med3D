/**
 * Created by Primoz on 23. 07. 2016.
 */

M3D.Quad = class extends M3D.Mesh {
    constructor(xy0, xy1, material) {

        var geometry = new M3D.Geometry();

        // Quad vertices
        geometry.vertices = M3D.Float32Attribute(
            [
                xy0.x,          xy1.y,           0,
                xy1.x,          xy0.y,           0,
                xy0.x,          xy0.y,           0,
                xy1.x,          xy1.y,           0
            ], 3
        );

        geometry.uv = M3D.Float32Attribute(
            [
                0, 0,
                1, 1,
                0, 1,
                1, 0
            ], 2
        );

        // Quad triangle vertices
        geometry.indices = M3D.Uint32Attribute([0, 1, 2, 0, 3, 1], 1);
        geometry.computeVertexNormals();


        // Super M3D.Mesh
        super(geometry, material);

        this.type = "Quad";
    }
};