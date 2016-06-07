// TODO - Primoz: referenca naj bo v GLManagerju

M3D.GLAttributeManager = class {
    
    /**
     * @param {WebGLRenderingContext} gl WebGL rendering context used for buffer allocation.
     */
    constructor (gl) {
        this._gl = gl;
        this._cached_buffers = new Map();
    }


    updateAttributes (object) {

        // BufferedGeometry
        var geometry = object.geometry;

        // Add geometry indices if it specifies them
        if (geometry.indices !== null) {
            this.updateAttribute(geometry.indices, this._gl.ELEMENT_ARRAY_BUFFER);
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
     * @param {BufferAttribute} attribute Object attribute
     * @param bufferType WebGL buffer type
     */
    updateAttribute (attribute, bufferType) {
        // Check if this attribute is already defined in the global properties
        var cachedBuffer = this.getCachedBuffer(attribute);

        // If the WebGL buffer property is undefined, create a new buffer (attribute not found in properties)
        if (attribute.dirty) {
            this.createBuffer(attribute, cachedBuffer, bufferType);
        }
    }

    /**
     * Creates new WebGL buffer which is then added as property to attribute from properties
     * @param attribute Properties attribute
     * @param buffer Object WebGLBuffer
     * @param bufferType Type of WebGL buffer that is to be created
     */
    createBuffer (attribute, buffer, bufferType) {
        this._gl.bindBuffer(bufferType, buffer);

        // Write the data to buffer
        this._gl.bufferData(bufferType, attribute.array, this._gl.STATIC_DRAW);

        // Mark attribute not dirty
        attribute.dirty = false;
    }

    /**
     * Fetches cached WebGL buffer for the given attribute object
     * @param {BufferAttribute} attribute An attribute whose WebGL buffer should be retrieved
     * @returns {map} Attributes WebGL buffer container
     */
    getCachedBuffer (attribute) {
        // Check if the buffer is already cached for this object
        var buffer = this._cached_buffers.get(attribute);

        // If the buffer for this object was not found. Create a new buffer and cache it.
        if (buffer === undefined) {
            buffer = this._gl.createBuffer();
            this._cached_buffers.set(attribute, buffer);
        }

        return buffer;
    }

    /**
     * Deletes cached WebGL buffer for the given attribute object
     * @param {BufferAttribute} attribute An attribute whose local version will be deleted
     */
    deleteCachedBuffer (attribute) {
        this._cached_buffers.delete(attribute);
    }

    /**
     * Clears buffer cache
     */
    clearBuffers () {
        this._cached_buffers.clear();
    }
};