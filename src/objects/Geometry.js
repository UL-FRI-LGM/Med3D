/**
 * Created by Ziga & Primoz on 1.4.2016.
 */

M3D.Geometry = class {

	constructor() {
        this._indices = null;
        this._vertices = null;
        this._normals = null;
        this._vertColor = null;
    }

    _normalizeNormals() {
        var normals = this._normals.array;

        var x, y, z, n;

        for (var i = 0; i < normals.length; i += 3) {
            x = normals[i];
            y = normals[i + 1];
            z = normals[i + 2];

            n = 1.0 / Math.sqrt(x * x + y * y + z * z);

            normals[i] *= n;
            normals[i + 1] *= n;
            normals[i + 2]  *= n;
        }
    }

    computeVertexNormals() {

        if (this._vertices) {
            var positions = this._vertices.array;

            if (!this._normals) {
                this._normals = new M3D.BufferAttribute(new Float32Array(positions.length), 3);
            }
            else {
                // reset existing normals to zero
                var array = this._normals.array;

                for (var i = 0; i < array.length; i ++) {
                    array[ i ] = 0;
                }
            }

            var normals = this._normals.array;

            var vA, vB, vC,
                pA = new THREE.Vector3(),
                pB = new THREE.Vector3(),
                pC = new THREE.Vector3(),

                cb = new THREE.Vector3(),
                ab = new THREE.Vector3();


            // Vertices are indexed
            if (this._indices) {
                var indices = this._indices.array;

                for (var i = 0; i < indices.length; i += 3 ) {
                    vA = indices[i] * 3;
                    vB = indices[i + 1] * 3;
                    vC = indices[i + 2] * 3;

                    pA.fromArray(positions, vA);
                    pB.fromArray(positions, vB);
                    pC.fromArray(positions, vC);

                    cb.subVectors(pC, pB);
                    ab.subVectors(pA, pB);
                    cb.cross(ab);

                    normals[vA] += cb.x;
                    normals[vA + 1] += cb.y;
                    normals[vA + 2] += cb.z;

                    normals[vB] += cb.x;
                    normals[vB + 1] += cb.y;
                    normals[vB + 2] += cb.z;

                    normals[vC ] += cb.x;
                    normals[vC + 1] += cb.y;
                    normals[vC + 2] += cb.z;
                }
            }
            else {
                // non-indexed elements (unconnected triangle soup)
                for (var i = 0; i < positions.length; i += 9) {

                    pA.fromArray( positions, i );
                    pB.fromArray( positions, i + 3 );
                    pC.fromArray( positions, i + 6 );

                    cb.subVectors( pC, pB );
                    ab.subVectors( pA, pB );
                    cb.cross( ab );

                    normals[ i ] = cb.x;
                    normals[ i + 1 ] = cb.y;
                    normals[ i + 2 ] = cb.z;

                    normals[ i + 3 ] = cb.x;
                    normals[ i + 4 ] = cb.y;
                    normals[ i + 5 ] = cb.z;

                    normals[ i + 6 ] = cb.x;
                    normals[ i + 7 ] = cb.y;
                    normals[ i + 8 ] = cb.z;
                }
            }

            this._normalizeNormals();

            this._normals.needsUpdate = true;
        }
    }

    get indices() { return this._indices; }
    get vertices() { return this._vertices; }
    get normals() { return this._normals; }
    get verticesColor() { return this._vertColor; }


    set indices(ind) { this._indices = ind; }
    set vertices(vert) { this._vertices = vert; }
    set normals(norm) { this._normals = norm; }
    set verticesColor(vertC) { this._vertColor = vertC; }
};
