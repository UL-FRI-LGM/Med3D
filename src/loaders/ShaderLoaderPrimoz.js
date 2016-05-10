/**
 * Created by Primoz on 26.4.2016.
 */

M3D.ShaderLoader = class {

    /**
     * Creates new shader loader object.
     * @param host_address Loading manager that is passed to XHRLoader.
     * @param loader_manager Host address
     */
    constructor (host_address, loading_manager) {
        this._host_address = (host_address !== undefined) ? host_address : window.location.hostname;
        this._path = "";
        this._url = this._host_address + this._path;
        this._XHRLoader = new M3D.XHRLoader(loading_manager);
    }

    /**
     * Sets the address of the host that contains shader sources.-
     * @param {string} host_address Host address
     */
    setHostAddress (host_address) {
        this._host_address = host_address;
        this._full_address = this._host_address + this._path;
    }

    /**
     * Sets the address of the host that contains shader sources.-
     * @param {string} path Host address
     */
    setDirectoryPath (path) {
        this._path = path;
        this._full_address = this._host_address + this._path;
    }

    setFullUrl (url) {
        this._url = url;

        // Parse out host_address and path
        var a = document.createElement('a');
        a.href = url;

        this._host_address = a.hostname;
        this._path = a.path;
    }


    /**
     * Asynchronously loads shader source code for each given shader template. Shader source is retrieved from the specified
     * host, from the shader directory whose location is specified by the path parameter.
     * @param shaders Shader templates (each template specifies shader name)
     * @param {function} onLoad Executes when all of the retrievals have been made. (Retrievals might not have been successful).
     *                   Returns shaders templates with the loaded source and no error flag, marked true if all of the
     *                   retrievals have been successful.
     * @param {function} onProgress Executes after every successful shader source retrieval. Returns shader template with source code.
     * @param {function} onError Executes when loader fails to retrieve source of the given shader template.
     */
    load (shaders, onLoad, onProgress, onError) {
        const n = shaders.length;

        // Set correct path
        this._XHRLoader.setPath(this._url);
        var noErrors = true;

        for (var i = 0; i < n; i++) {
            if (!shaders[i].hasOwnProperty('name')) {
                // TODO: Return correct error event
                if (onError !== undefined) {
                    onError(shaders[i], "error");
                }
                console.error("Specified shader template with index " + i + " is invalid.");
                continue;
            }

            // Notify shader
            const idx = i;
            var onShaderLoaded = function (source) {
                shaders[idx]['source'] = source;
                // Return already loaded shaders
                if (onProgress !== undefined) {
                    onProgress(shaders[idx]);
                }
                // Finished loading
                if (idx === n-1 && onLoad !== undefined) {
                    onLoad(noErrors);
                }
            };

            // On error callback.. Forward it to listener if exists
            var onShaderLoadError = function (event) {
                noErrors = false;

                // Notify error
                if (onError !== undefined) {
                    onError(shaders[idx], event);
                }
                // Finished loading
                if (idx === n-1 && onLoad !== undefined) {
                    onLoad(noErrors);
                }
            };

            // Start loading
            this._XHRLoader.load(shaders[i].name, onShaderLoaded, undefined, onShaderLoadError);
        }
    }

    /**
     * Helper function for easier loading of program shaders source code
     * @param programTemplates Array of M3D.ProgramTemplates
     * @param {function} onLoad Executes when all of the retrievals have been made. (Retrievals might not have been successful).
     *                   Returns shaders templates with the loaded source and no error flag, marked true if all of the
     *                   retrievals have been successful.
     * @param {function} onProgress Executes after every successful shader source retrieval. Returns shader template with source code.
     * @param {function} onError Executes when loader fails to retrieve source of the given shader template.
     */
    loadProgramsSources (programTemplates, onLoad, onProgress, onError) {
        var dirtyShaders = [];

        // Find all dirty shaders (dirty shader - shader whose source has not jet been loaded)
        for (var i = 0; i < programTemplates.length; i++) {
            if (programTemplates[i].vertexShader.source === undefined) {
                dirtyShaders.push(programTemplates[i].vertexShader);
            }
            if (programTemplates[i].vertexShader.source === undefined) {
                dirtyShaders.push(programTemplates[i].fragmentShader);
            }
        }

        // Nothing needs to be loaded
        if (dirtyShaders.length == 0) {
            onLoad(true);
        }

        // Load the dirty shaders
        this.load(dirtyShaders, onLoad, onProgress, onError);
    }

};