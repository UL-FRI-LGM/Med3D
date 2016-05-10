/**
 * Created by Primoz on 24.4.2016.
 */

// Requested WebGL version
M3D.WEBGL1 = ["webgl", "experimental-webgl"];
M3D.WEBGL2 = ["webgl2", "experimental-webgl2"];


M3D.GLManager = class {

    /**
     * Creates new WebGL context manager. The context is retrieved from the given canvas.
     * @param {canvas} canvas HTML5 canvas from which GL context is retrieved
     * @param gl_version Specifies which version of GL context should be retrieved
     */
    constructor (canvas, gl_version) {
        // GL Context
        this._gl = null;

        // Try to fetch GL context
        for (var i = 0; i < gl_version.length; i++) {
            try {
                this._gl = canvas.getContext(gl_version[i]);
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

        this._programs = new M3D.GLPrograms(this._gl);

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

    get cache_programs () { return M3D._ProgramCaching; }

    set cache_programs (enable) { M3D._ProgramCaching = enable; }
};