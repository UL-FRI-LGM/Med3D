/**
 * Created by Ziga & Primoz on 1.4.2016.
 */

M3D.Geometry = class {

	constructor() {
        this._uuid = THREE.Math.generateUUID();
        this.type = "Geometry";

        // Buffers
        this._indices = null;
        this._vertices = null;
        this._normals = null;
        this._vertColor = null;
        this._uv = null;
        this._wireframeIndices = null;

        // Bounding
        this._boundingBox = null;
        this._boundingSphere = null;

        // Parameter on change listener
        this._onChangeListener = null;

        // If this is set to true.. wireframe will be rendered instead of planes
        this._drawWireframe = false;
    }

    buildWireframeBuffer() {
        if (this._vertices.count() === 0)
            return;

        var indices = [];
        var array = this._vertices.array;

        for ( var i = 0, l = ( array.length / 3 ) - 1; i < l; i += 3 ) {
            var a = i;
            var b = i + 1;
            var c = i + 2;

             // A - B - C - A
            indices.push( a, b, b, c, c, a );
        }

        // Create new buffer geometry for the wireframe
        this._wireframeIndices = new M3D.BufferAttribute(new Uint32Array(indices), 1);
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

    computeBoundingBox() {

        // Check if the bounding box already exist
        if ( this._boundingBox === null ) {
            this._boundingBox = new THREE.Box3();
        }

        // Create new bounding box using the vertices
        if (this._vertices) {
            this._boundingBox.setFromArray(this._vertices.array);
        }
        else {
            this._boundingBox.makeEmpty();
        }

        if ( isNaN( this._boundingBox.min.x ) || isNaN( this._boundingBox.min.y ) || isNaN( this._boundingBox.min.z ) ) {
            console.error('Geometry error: One or more of bounding box axis min is NaN.');
        }
    }

    computeBoundingSphere() {
        let box = new THREE.Box3();
        let vector = new THREE.Vector3();

        // Check if the sphere already exists
        if (this._boundingSphere === null) {
            this._boundingSphere = new THREE.Sphere();
        }

        if (this._vertices) {
            let array = this._vertices.array;
            let center = this._boundingSphere.center;

            // Set initial bounding sphere based on the bounding box
            box.setFromArray(array);
            box.center(center);

            // Optimize sphere radius
            let maxRadiusSq = 0;

            for (let i = 0; i < array.length; i += 3) {
                vector.fromArray(array, i);
                maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(vector));
            }

            this._boundingSphere.radius = Math.sqrt(maxRadiusSq);

            if (isNaN(this._boundingSphere.radius)) {
                console.error('Geometry error: Bounding sphere radius is NaN.');
            }
        }
    }

    // region GETTERS
    get indices() { return this._indices; }
    get vertices() { return this._vertices; }
    get normals() { return this._normals; }
    get vertColor() { return this._vertColor; }
    get uv() { return this._uv; }
    get wireframeIndices() { return this._wireframeIndices; }
    get drawWireframe() { return this._drawWireframe; }
    get boundingBox() { return this._boundingBox; }
    get boundingSphere() {
	    // If the bounding sphere was not jet computed compute it
	    if (this._boundingSphere === null) {
	        this.computeBoundingSphere();
        }

	    return this._boundingSphere;
	}
    // endregion

    // region SETTERS
    set indices(values) {
        this._indices = values;

        // Notify onChange subscriber
        if (this._onChangeListener) {
            var update = {uuid: this._uuid, changes: {array: this._indices.array.buffer.slice(0), itemSize: this._indices.itemSize}};
            this._onChangeListener.geometryUpdate(update)
        }
    }
    set vertices(values) {
        this._vertices = values;

        // Notify onChange subscriber
        if (this._onChangeListener) {
            var update = {uuid: this._uuid, changes: {array: this._vertices.array.buffer.slice(0), itemSize: this._vertices.itemSize}};
            this._onChangeListener.geometryUpdate(update)
        }
    }
    set normals(values) {
        this._normals = values;

        // Notify onChange subscriber
        if (this._onChangeListener) {
            var update = {uuid: this._uuid, changes: {array: this._normals.array.buffer.slice(0), itemSize: this._normals.itemSize}};
            this._onChangeListener.geometryUpdate(update)
        }
    }
    set vertColor(values) {
        this._vertColor = values;

        // Notify onChange subscriber
        if (this._onChangeListener) {
            var update = {uuid: this._uuid, changes: {array: this._vertColor.array.buffer.slice(0), itemSize: this._vertColor.itemSize}};
            this._onChangeListener.geometryUpdate(update)
        }
    }
    set uv(values) { this._uv = values; }
    set wireframeIndices(values) { this._wireframeIndices = values; }
    set drawWireframe(val) { this._drawWireframe = val; }
    set onChangeListener(listener) { this._onChangeListener = listener; }
    // endregion

    toJson() {
        var obj = {};

        obj._uuid = this._uuid;
        obj.type = this.type;

        if (this._indices) {
            obj.indices = {array: this._indices.array.buffer.slice(0), itemSize: this._indices.itemSize};
        }

        if (this._vertices) {
            obj.vertices = {array: this._vertices.array.buffer.slice(0), itemSize: this._vertices.itemSize};
        }

        if (this._normals) {
            obj.normals = {array: this._normals.array.buffer.slice(0), itemSize: this._normals.itemSize};
        }

        if (this._vertColor) {
            obj.vertColor = {array: this._vertColor.array.buffer.slice(0), itemSize: this._vertColor.itemSize};
        }

        return obj;
    }

    static fromJson(obj) {
        var geometry = new M3D.Geometry();

        geometry._uuid = obj._uuid;

        if (obj.indices) {
            geometry._indices = M3D.Uint32Attribute(obj.indices.array, obj.indices.itemSize);
        }

        if (obj.vertices) {
            geometry._vertices = M3D.Float32Attribute(obj.vertices.array, obj.vertices.itemSize);
        }

        if (obj.normals) {
            geometry._normals = M3D.Float32Attribute(obj.normals.array, obj.normals.itemSize);
        }

        if (obj.vertColor) {
            geometry._vertColor = M3D.Float32Attribute(obj.vertColor.array, obj.vertColor.itemSize);
        }

        return geometry;
    }

    update(data) {

        for (var prop in data) {
            switch (prop) {
                case "indices":
                    this._indices = M3D.Uint32Attribute(data.indices.array, data.indices.itemSize);
                    delete data.indices;
                    break;
                case "vertices":
                    this._vertices = M3D.Float32Attribute(data.vertices.array, data.vertices.itemSize);
                    delete data.vertices;
                    break;
                case "normals":
                    this._normals = M3D.Float32Attribute(data.normals.array, data.normals.itemSize);
                    delete data.normals;
                    break;
                case "vertColor":
                    this._vertColor = M3D.Float32Attribute(data.vertColor.array, data.vertColor.itemSize);
                    delete data.vertColor;
                    break;
            }
        }
    }
};
