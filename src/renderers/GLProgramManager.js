/**
 * Created by Primoz on 25.4.2016.
 */

M3D.VERTEX_SHADER = "vertex";
M3D.FRAGMENT_SHADER = "fragment";

M3D.GLProgramManager = class {

    constructor (gl) {
        this._gl = gl;
        this._compiledPrograms = {};
    }

    /**
     *
     * @param programTemplate
     * @returns {GLProgram}
     */
    compileProgram (programTemplate) {
        // Generate program id from it's shaders
        var programId = programTemplate.id;

        // Check if the entry for this program already exist
        var program = this._compiledPrograms[programId];

        if (program === undefined) {
            program = new M3D.GLProgram(this._gl);
        }

        // Check if the program is already initialized
        if (!program.initialized) {
            // Fetch shader types
            var sources = programTemplate.sources;
            var shaderTypes = Object.keys(sources);

            var compiled = [];

            // Compile the shaders
            for (var i = 0; i < shaderTypes.length; i++) {
                switch (shaderTypes[i]) {
                    case M3D.VERTEX_SHADER:
                        compiled.push(this._compileShader(sources[M3D.VERTEX_SHADER], this._gl.VERTEX_SHADER));
                        program.attachShader(compiled[compiled.length - 1]);
                        break;
                    case M3D.FRAGMENT_SHADER:
                        compiled.push(this._compileShader(sources[M3D.FRAGMENT_SHADER], this._gl.FRAGMENT_SHADER));
                        program.attachShader(compiled[compiled.length - 1]);
                        break;
                    default:
                        console.error("Encountered unknown shader type.");
                        break;
                }
            }

            // Program linking
            this._gl.linkProgram(program.glProgram);

            // Clean up
            while (compiled.length > 0) {
                this._gl.deleteShader(compiled.pop());
            }

            // Initialize setters
            program.attributeSetter = this._initAttributeSetter(program.glProgram);
            program.uniformSetter = this._initUniformSetter(program.glProgram);

            // Mark as initialized
            program.initialized = true;
            this._compiledPrograms[programId] = program;
        }

        return program;
    }

    /**
     * Retrieves already compiled program from the cache
     * @param programId ID of the requested program
     * @returns {*}
     */
    fetchCompiledProgram (programId) { return this._compiledPrograms[programId]; }


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
     * @param {string} programId Unique program identificator used for cached programs dictionary addressing.
     * @returns {GLProgram} Cached program if it exists in the CachedPrograms dictionary, otherwise new gl program that will be cached
     * @private
     */
    _getCachedProgram (programId) {
        var program = this._compiledPrograms[programId];

        // If no previous entry exists.. Compile new program
        if (program === undefined) {
            program = new M3D.GLProgram(this._gl);

            // Cache program
            this._compiledPrograms[programId] = program;
        }

        return program
    }
};