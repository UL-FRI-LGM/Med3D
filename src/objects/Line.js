/**
 * Created by Primoz on 6. 08. 2016.
 */

/**
 * Created by Primoz on 23. 07. 2016.
 */

M3D.Line = class extends M3D.Mesh {
    constructor(points, material, geometry) {

        if (geometry === undefined) {
            var geometry = new M3D.Geometry();

            // Quad vertices
            geometry.vertices = M3D.Float32Attribute(points, 3);

            if (material === undefined) {
                material = new M3D.MeshBasicMaterial();
            }
        }

        // Super M3D.Mesh
        super(geometry, material);

        this.type = "Line";
    }

    setPoints(points) {
        this._geometry.vertices.array = new Float32Array(points);
    }

    static fromJson(data, geometry, material) {
        // Create mesh object
        var line = new M3D.Line(undefined, material, geometry);

        // Import Object3D parameters
        line = super.fromJson(data, undefined, undefined, line);

        return line;
    }

};