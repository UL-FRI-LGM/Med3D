/**
 * Created by Primoz on 24.4.2016.
 */

// Requested WebGL version
M3D.WEBGL1 = "gl1";
M3D.WEBGL2 = "gl2";

M3D.GLManager = class {

    /**
     * Creates new WebGL context manager. The context is retrieved from the given canvas.
     * @param {canvas} canvas HTML5 canvas from which GL context is retrieved
     * @param gl_version Specifies which version of GL context should be retrieved
     */
    constructor (canvas, glVersion) {
        // GL Context
        this._gl = null;
        this._glVersion = glVersion;

        var glKeys = (glVersion == M3D.WEBGL1) ? ["webgl", "experimental-webgl"] : ["webgl2", "experimental-webgl2"];

        // Try to fetch GL context
        for (var i = 0; i < glKeys.length; i++) {
            try {
                this._gl = canvas.getContext(glKeys[i]);
            } catch (e){
                console.error(e);
            }

            if (this._gl) {
                break;
            }
        }

        // Warn the user if the context could not be retrieved
        if (!this._gl) {
            throw 'ERROR: Failed to retrieve GL Context.'
        }

        this._attributeManager = new M3D.GLAttributeManager(this._gl);

        //region Clear values
        this.autoClear = true;
        this._clearColor = new THREE.Vector4(0, 0, 0, 0);
        this._clearDepth = null;
        this._clearStencil = null;

        // Initialize clear values
        this.setClearColor(0, 0, 0, 1);
        this.setClearDepth(1);
        this.setClearStencil(0);
        //endregion
    }

    /**
     * Fetches GL program using the given vertex and fragment shader
     * @param vtx_shader
     * @param frag_shader
     * @returns {*}
     */
    fetchProgram (vtx_shader, frag_shader) {
        if (vtx_shader.hasOwnProperty('source') && frag_shader.hasOwnProperty('source')) {
            return this._programs.retrieveProgram(vtx_shader, frag_shader);
        }
        else {
            console.error("Given shaders have no source. Are you loading the shaders correctly?");
            return null;
        }
    }

    //TODO: Document this
    setupProgram (programTemplate) {
        var vtx_shader = programTemplate.vertexShader;
        var frag_shader = programTemplate.fragmentShader;

        if (vtx_shader.hasOwnProperty('source') && frag_shader.hasOwnProperty('source')) {
            programTemplate['program'] =  this._programs.retrieveProgram(vtx_shader, frag_shader);
        }
        else {
            throw "Given shaders have no source. Are you loading the shaders correctly?";
        }
    }

    /**
     * Updates object geometry attributes (creates GL buffers or updates them if they already exist)
     * @param object
     */
    updateObjectData(object) {
        // BufferedGeometry
        var geometry = object.geometry;

        // Add geometry indices if it specifies them
        if (geometry.indices !== null) {
            this._attributeManager.updateAttribute(geometry.indices, this._gl.ELEMENT_ARRAY_BUFFER);
        }

        if (geometry.vertices != null) {
            this._attributeManager.updateAttribute(geometry.vertices, this._gl.ARRAY_BUFFER);
        }
        
        if (geometry.drawWireframe) {
            if (geometry.wireframeIndices === null) {
                geometry.buildWireframeBuffer();
            }
            
            this._attributeManager.updateAttribute(geometry.wireframeIndices, this._gl.ELEMENT_ARRAY_BUFFER);
        }

        if (geometry.normals != null) {
            this._attributeManager.updateAttribute(geometry.normals, this._gl.ARRAY_BUFFER);
        }

        if (geometry._vertColor != null) {
            this._attributeManager.updateAttribute(geometry._vertColor, this._gl.ARRAY_BUFFER);
        }
    }

    getBuffer (attribute) {
        return this._attributeManager.getCachedBuffer(attribute);
    }


    //region CANVAS CLEARING FUNCTIONS
    /**
     * Clears the selected gl buffers with their preset value
     * @param {boolean} color true if clear, false if not
     * @param {boolean} depth true if clear, false if not
     * @param {boolean} stencil true if clear, false if not
     */
    clear (color, depth, stencil) {
        var bits = 0;

        if ( color === undefined || color ) bits |= this._gl.COLOR_BUFFER_BIT;
        if ( depth === undefined || depth ) bits |= this._gl.DEPTH_BUFFER_BIT;
        if ( stencil === undefined || stencil ) bits |= this._gl.STENCIL_BUFFER_BIT;

        this._gl.clear(bits);
    };

    /**
     * Sets clear color values
     * @param r Red
     * @param g Green
     * @param b Blue
     * @param a Alpha
     */
    setClearColor (r, g, b, a) {
        var color = new THREE.Vector4(r, g, b, a);

        if (this._clearColor.equals(color) === false) {
            this._gl.clearColor(r, g, b, a);
            this._clearColor.copy(color);
        }
    };

    /**
     * Sets depth buffer clear value
     * @param depth Depth buffer clear value (0 - 1)
     */
    setClearDepth (depth) {
        if (this._clearDepth !== depth) {
            this._gl.clearDepth(depth);
            this._clearDepth = depth;
        }
    };

    /**
     * Sets stencil buffer clear value
     * @param stencil Stencil buffer clear value
     */
    setClearStencil (stencil) {
        if (this._clearStencil !== stencil) {
            this._gl.clearStencil(stencil);
            this._clearStencil = stencil;
        }
    };

    //endregion


    /**
     * GETTERS & SETTERS
     */
    get context () { return this._gl; }
    get glVersion () { return this._glVersion; }

    get cache_programs () { return M3D._ProgramCaching; }

    set cache_programs (enable) { M3D._ProgramCaching = enable; }
};