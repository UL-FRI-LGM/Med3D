// TODO - Primoz: referenca naj bo v GLManagerju

M3D.GLAttributeManager = class {

    /**
     * @param gl
     * @param {GLProperties} properties Object property structure that holds properties of all of the objects.
     */
    constructor (gl, properties) {
        this._gl = gl;
        // WebGLProperties reference
        this.properties = properties;
    }

    /**
     * Updates object geometry attributes (creates GL buffers or updates them if they already exist)
     * @param object
     * @returns {m.geometry|{vertices, normals, uvs}|*}
     */
    updateAttributes (object) {

        // BufferedGeometry
        var geometry = object.geometry;

        // Add geometry indices if it specifies them
        if (geometry.index !== null) {
            this.updateAttribute(geometry.index, this._gl.ELEMENT_ARRAY_BUFFER);
        }

        // Add all of the geometry attributes
        for (var name in geometry.attributes) {
            this.updateAttribute(geometry.attributes[name], this._gl.ARRAY_BUFFER);
        }

        return geometry;
    }

    /**
     * Checks if the given attribute is already tracked in the global properties and has its WebGL buffer set (if not it creates a new buffer).
     * If the properties attribute and object attribute versions mismatch, it updates the properties attribute with object attribute.
     * @param attribute Object attribute
     * @param bufferType WebGL buffer type
     */
    updateAttribute (attribute, bufferType) {
        // Check if this attribute is already defined in the global properties
        var attributeProperties = this.properties.getProperties(attribute);

        // If the WebGL buffer property is undefined, create a new buffer (attribute not found in properties)
        if (attributeProperties.__webglBuffer === undefined) {
            this.createBuffer(attributeProperties, attribute, bufferType);
        }
        // If the WebGL buffer is already defined check if its version is up to date
        else if (attributeProperties.version != attribute.version) {
            this.updateBuffer(attributeProperties, attribute, bufferType);
        }
    }

    /**
     * Creates new WebGL buffer which is then added as property to attribute from properties
     * @param attributeProperties Properties attribute
     * @param attribute Object attribute
     * @param bufferType Type of WebGL buffer that is to be created
     */
    createBuffer (attributeProperties, attribute, bufferType) {
        attributeProperties.__webglBuffer = this._gl.createBuffer();

        this._gl.bindBuffer(bufferType, attributeProperties.__webglBuffer);

        // Check whether buffer should be dynamic or static
        var drawBatching = attributeProperties.dynamic ? this._gl.DYNAMIC_DRAW : this._gl.STATIC_DRAW;

        // Write the data to buffer
        this._gl.bufferData(bufferType, attribute.array, drawBatching);

        // Used for attribute book keeping
        attributeProperties.version = attribute.version;
    }

    /**
     * Updates current WebGL buffer specified in attribute properties with the newer object attribute.
     * @param attributeProperties Properties attribute
     * @param attribute Object attribute
     * @param bufferType Type of WebGL buffer that is to be created
     */
    updateBuffer (attributeProperties, attribute, bufferType) {
        this._gl.bindBuffer(bufferType, attributeProperties.__webglBuffer );

        // Updates the buffer without using the buffer ranges (replaces whole buffer)
        if ( attributeProperties.dynamic === false || attributeProperties.updateRange.count === - 1 ) {
            this._gl.bufferSubData( bufferType, 0, attribute.array );
        }
        // There is nothing to update
        else if ( attributeProperties.updateRange.count === 0 ) {
            console.error( 'M3D.WebGLObjects.updateBuffer: dynamic M3D.BufferAttribute marked as needsUpdate but updateRange.count is 0, ensure you are using set methods or updating manually.' );
        }

        else {
            this._gl.bufferSubData( bufferType, attribute.updateRange.offset * attribute.array.BYTES_PER_ELEMENT,
                attribute.array.subarray( attribute.updateRange.offset, attribute.updateRange.offset + attribute.updateRange.count ) );

            attribute.updateRange.count = 0; // reset range
        }
        attributeProperties.version = attribute.version;
    }

    /**
     * Retrieves WebGL Buffer object
     * @param {BufferAttribute} attribute BufferAttribute whose WebGL buffer should be retrieved
     * @returns {*|WebGLBuffer} WebGL Buffer
     */
    getAttributeBuffer (attribute) {
        return this.properties.getProperties(attribute).__webglBuffer;
    }

};