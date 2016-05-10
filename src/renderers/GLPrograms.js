/**
 * Created by Primoz on 25.4.2016.
 */

// Program caching is enabled by default
M3D._ProgramCaching = true;
M3D.CachedPrograms = {};

M3D.GLPrograms = class {

    constructor (gl) {
        this._gl = gl;
    }

    retrieveProgram (vtx_shader, frag_shader) {
        // Generate program id from it's shaders
        var program_id = vtx_shader.id + frag_shader.id;

        var program = this._getCachedProgram(program_id);

        // Check if program needs to be linked
        if (program['linked'] !== true) {
            // Compile and attach vertex and fragment shader
            vtx_shader.compiled = this._compileShader(vtx_shader.source, this._gl.VERTEX_SHADER);
            this._gl.attachShader(program, vtx_shader.compiled);

            frag_shader.compiled = this._compileShader(frag_shader.source, this._gl.FRAGMENT_SHADER);
            this._gl.attachShader(program, frag_shader.compiled);

            // Program linking
            this._gl.linkProgram(program);

            // Clean up
            this._gl.deleteShader(vtx_shader.compiled);
            this._gl.deleteShader(frag_shader.compiled);

            program['linked'] = true;
        }

        // Create attribute and uniform setters
        if (program['attributesSetter'] === undefined) {
            program['attributesSetter'] = this._initAttributeSetter(program);
        }
        if (program['uniformSetter'] === undefined) {
            program['uniformSetter'] = this._initUniformSetter(program);
        }

        return program;
    }

    /**
     * Initializes attribute setter based on the compiled shaders
     * @private
     */
    _initAttributeSetter (program) {
        var attributeSetter = {};

        // Self reference is needed in setter scope
        var self = this;

        var n = this._gl.getProgramParameter(program, this._gl.ACTIVE_ATTRIBUTES);

        for (var i = 0; i < n; i++) {
            // Retrieve attribute name
            const info = this._gl.getActiveAttrib(program, i);
            const location = self._gl.getAttribLocation(program, info.name);

            // Create attribute setter function
            attributeSetter[info.name] = {};
            attributeSetter[info.name]['set'] = function (buffer, item_size) {
                self._gl.enableVertexAttribArray(location);
                self._gl.bindBuffer(self._gl.ARRAY_BUFFER, buffer);
                self._gl.vertexAttribPointer(location, item_size, self._gl.FLOAT, false, 0, 0);
            };

            // Create attribute pointer freeing function
            attributeSetter[info.name]['free'] = function () {
                self._gl.disableVertexAttribArray(location);
            };
        }

        return attributeSetter;
    }

    /**
     * Initializes uniform setter based on the compiled shaders
     * @private
     */
    _initUniformSetter (program) {
        var uniformSetter = {};

        // Self reference is needed in setter scope
        var self = this;

        var n = this._gl.getProgramParameter(program, this._gl.ACTIVE_UNIFORMS);

        for (var i = 0; i < n; i++) {
            // Fetch uniform info and location
            const info = self._gl.getActiveUniform(program, i);
            const location = self._gl.getUniformLocation(program, info.name);

            uniformSetter[info.name] = {};

            switch (info.type) {
                case self._gl.FLOAT:
                    uniformSetter[info.name]['set'] = function (value) {
                        self._gl.uniform1f(location, value);
                    };
                    break;

                case self._gl.FLOAT_VEC2:
                    uniformSetter[info.name]['set'] = function (value) {
                        self._gl.uniform2f(location, value[0], value[1]);
                    };
                    break;

                case self._gl.FLOAT_VEC3:
                    uniformSetter[info.name]['set'] = function (value) {
                        self._gl.uniform3f(location, value[0], value[1], value[2]);
                    };
                    break;

                case self._gl.FLOAT_VEC4:
                    uniformSetter[info.name]['set'] = function (value) {
                        self._gl.uniform4f(location, value[0], value[1], value[2], value[3]);
                    };
                    break;

                case self._gl.FLOAT_MAT3:
                    uniformSetter[info.name]['set'] = function (value) {
                        self._gl.uniformMatrix3fv(location, false, value);
                    };
                    break;
                case self._gl.FLOAT_MAT4:
                    uniformSetter[info.name]['set'] = function (value) {
                        self._gl.uniformMatrix4fv(location, false, value);
                    };
                    break;

                case self._gl.INT:
                    uniformSetter[info.name]['set'] = function (value) {
                        self._gl.uniform1i(location, value);
                    };
                    break;

                case self._gl.INT_VEC2:
                    uniformSetter[info.name]['set'] = function (value) {
                        self._gl.uniform2i(location, value[0], value[1]);
                    };
                    break;
                case self._gl.INT_VEC3:
                    uniformSetter[info.name]['set'] = function (value) {
                        self._gl.uniform3i(location, value[0], value[1], value[2]);
                    };
                    break;
                case self._gl.INT_VEC4:
                    uniformSetter[info.name]['set'] = function (value) {
                        self._gl.uniform4i(location, value[0], value[1], value[2], value[3]);
                    };
                    break
            }
        }

        return uniformSetter;
    }

    /**
     * Compiles the given GLSL shader source. In case of an error the debug log is written to console.
     * @param {string} source GLSL Shader Source
     * @param type Shader type (VERTEX_SHADER or FRAGMENT_SHADER
     * @returns {WebGLShader} Compiled GLSL Shader
     * @private
     */
    _compileShader (source, type) {
        var shader = this._gl.createShader(type);

        this._gl.shaderSource(shader, source);
        this._gl.compileShader(shader);

        // Compile info
        var status = this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS);

        if (!status) {
            console.error(this._gl.getShaderInfoLog(shader));
        }

        if (this._gl.getShaderInfoLog(shader) !== '') {
            console.warn( 'M3D.WebGLShader: _gl.getShaderInfoLog()', type === this._gl.VERTEX_SHADER ? 'vertex' : 'fragment', this._gl.getShaderInfoLog(shader));
        }

        return shader;
    }

    /**
     * Fetches cached WebGL program made in previous fetches or new WebGL program if it's the first time this program is being fetched.
     * @param {string} program_id Unique program identificator used for cached programs dictionary addressing.
     * @returns {WebGLProgram} Cached program if it exists in the CachedPrograms dictionary, otherwise new gl program that will be cached
     * @private
     */
    _getCachedProgram (program_id) {
        if (!M3D._ProgramCaching) {
            return this._gl.createProgram();
        }

        var program = M3D.CachedPrograms[program_id];

        // If no previous entry exists.. Compile new program
        if (program === undefined) {
            program = this._gl.createProgram();

            // Cache program
            M3D.CachedPrograms[program_id] = program;
        }

        return program
    }

    /**
     * Retrieves attribute setter object.
     * @returns {function..} Object with attribute setters as properties. Each property name is defined by attribute name that it sets up.
     * in the shader program.
     */
    //getAttributeSetter () {
    //    return this.program.attributesSetter;
   // }

    /**
     * Retrieves uniform setter object.
     * @returns {function..} Object with uniform setters as properties. Each property name is defined by uniform name that it sets up.
     * in the shader program.
     */
   // getUniformSetter () {
    //    return this.program.attributesSetter;
    //}

    /**
     * Self explanatory
     */
    //use() {
    //    this._gl.useProgram(this.program);
    //}

};