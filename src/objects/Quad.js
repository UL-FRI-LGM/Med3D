/**
 * Created by Primoz on 23. 07. 2016.
 */

M3D.Quad = class extends M3D.Mesh {
    constructor(xy0, xy1, material, geometry) {

        if (geometry === undefined) {
            var geometry = new M3D.Geometry();

            // Quad vertices
            geometry.vertices = M3D.Float32Attribute(
                [
                    xy0.x, xy1.y, 0,
                    xy1.x, xy0.y, 0,
                    xy0.x, xy0.y, 0,
                    xy1.x, xy1.y, 0
                ], 3
            );

            geometry.vertColor = M3D.Float32Attribute(
                [
                    1, 1, 1, 1,
                    1, 1, 1, 1,
                    1, 1, 1, 1,
                    1, 1, 1, 1
                ], 4
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
        }

        // Super M3D.Mesh
        super(geometry, material);

        this._xy0 = xy0;
        this._xy1 = xy1;

        this.type = "Quad";
    }

    toJson() {
        var obj = super.toJson();

        // Add Quad parameters
        obj.xy0 = this._xy0;
        obj.xy1 = this._xy1;

        return obj;
    }

    static fromJson(data, geometry, material) {
        // Create mesh object
        var quad = new M3D.Quad(data.xy0, data.xy1, material, geometry);

        // Import Object3D parameters
        quad = super.fromJson(data, undefined, undefined, quad);

        return quad;
    }
};