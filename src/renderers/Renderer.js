/**
 * Created by Ziga on 25.3.2016.
 */


/**
 * Interface for renderers, implemented by VolumeRenderer, MeshRenderer, etc.
 * @class Renderer
 */
M3D.Renderer = class {
	// Subclasses perform WebGL initialization, texture allocation, etc.
	// Renderers can be run offline, without WebGL.
	constructor(canvas, gl_version) {
        // Create new gl manager with appropriate version
        this._glManager = new M3D.GLManager(canvas, gl_version);
        this._canvas = canvas;

        // Retrieve context from gl manager
        this._gl = this._glManager.context;

        // Throw error if the gl context could not be retrieved
		// TODO: Put this in GLManager
		if (!this._gl) {
            throw 'Something went wrong while initializing WebGL context.'
        }

        // Program management
        this._glProgramManager = new M3D.GLProgramManager(this._gl);
        this._shaderLoader = new M3D.ShaderLoader();

        this._requiredPrograms = [];
        this._compiledPrograms = new Map();
        this._loadingPrograms = new Set();

        // Render target
        this._currentRenderTarget = null;

        //region Execution values
        this._autoClear = true;
        //endregion

		this._selectedRenderer = null;
	}

	render(scene, camera, renderTarget) {
        // Check if correct object instance was passed as camera
        if (camera instanceof M3D.Camera === false) {
            console.error(LOGTAG + "Given camera is not an instance of M3D.Camera");
            return;
        }

        // If camera is not part of the scene.. Update its worldMatrix anyways
        if (camera.parent === null)
            camera.updateMatrixWorld();

        camera.matrixWorldInverse.getInverse(camera.matrixWorld);

        // Clear intermediate data from the previous render call
        this._requiredPrograms = [];
        this._compiledPrograms.clear();

        // Check if render target was specified
        if (renderTarget !== undefined) {
            this._initRenderTarget(renderTarget);
        }

        // Clear color, depth and stencil buffer
        if (this._glManager.autoClear) {
            this._glManager.clear(true, true, true);
        }

        // Calls selected renderer function which should be overrided in the extending class
		this._selectedRenderer(scene, camera);

        // If RTT cleanup viewport and frame-buffer
        if (this._currentRenderTarget) {
            this._cleanupRenderTarget();
            this._currentRenderTarget = null;
        }
	}

	// region PROGRAM MANAGEMENT
    _downloadProgram(programName) {
        let scope = this;

        // Called when the program template is loaded.. Initiates shader compilation
        let onLoad = function (programTemplateSrc) {
            scope._glProgramManager.addTemplate(programTemplateSrc);
            scope._loadingPrograms.delete(programName);
        };

        // Something went wrong while fetching the program templates
        let onError = function (event) {
            console.error("Failed to load program " + programName + ".")
            scope._loadingPrograms.delete(programName);
        };

        // Check if the program is already loading
        if (!this._loadingPrograms.has(programName)) {
            this._loadingPrograms.add(programName);

            console.log(programName);
            // Initiate loading
            this._shaderLoader.loadProgramSources(programName, onLoad, undefined, onError);
        }
    }

    _loadRequiredPrograms() {
        let everythingLoaded = true;

        // Fetch the required programs
        for (let i = 0; i < this._requiredPrograms.length; i++) {

            // Fetch program name
            let programName = this._requiredPrograms[i].name;

            // Check is the required program template is already downloaded
            if (!this._glProgramManager.isTemplateDownloaded(programName)) {
                everythingLoaded = false;

                this._downloadProgram(programName);
            }
            else {
            	// TODO: Put this somewhere else?
                // Build program for specific number of lights (is disregarded if the shader is not using lights)
				let numLights = 0;
				if (this._lightsCombined) {
                    numLights = this._lightsCombined.directional.length + this._lightsCombined.point.length;
                }

                let program = this._glProgramManager.fetchProgram(this._requiredPrograms[i], numLights);

                // Bind required program and compiled program
                this._compiledPrograms.set(this._requiredPrograms[i].programID, program);
            }
        }

        return everythingLoaded;
    }

    preDownloadPrograms(programList) {

        for (let i = 0; i < programList.length; i++) {
            if (!this._glProgramManager.isTemplateDownloaded(programList[i])) {
                this._downloadProgram(programList[i]);
            }
        }
    }
	// endregion

	// region RENDER TARGET
    _initRenderTarget(renderTarget) {
        // Check if the render target is specified
        this._currentRenderTarget = renderTarget;
        let rttViewport = renderTarget._viewport;

        // Setup viewport
        this._gl.viewport(rttViewport.x, rttViewport.y, rttViewport.z, rttViewport.w);

        this._glManager.initRenderTarget(renderTarget);
    }

    _cleanupRenderTarget() {
        this._currentRenderTarget = null;
        this._gl.viewport(0, 0, this._canvas.width, this._canvas.height);

        this._glManager.cleanupRenderTarget();
    }
	// endregion

    /**
	 * Clears cached attributes such as position arrays, indices and uv coordinates as well as cached textures.
     */
    clearCachedAttributes() {
        this._glManager.clearAttributeBuffers();
    }

    /**
     * Sets the url to shader server & directory from which the shaders source is loaded.
     * @param url Full url to the shader server directory
     */
    addShaderLoaderUrls (...urls) { this._shaderLoader.addUrls(urls); }

    // region SETTERS / GETTERS
    /**
     * SETTERS / GETTERS
     */
    set autoClear(clear) {
        this._autoClear = clear;
    }

    get autoClear() {
        return this._autoClear;
    }

    set clearColor(hexColor) {
        let components = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
        if (components) {
            this._glManager.setClearColor(parseInt(components[1], 16) / 255, parseInt(components[2], 16) / 255, parseInt(components[3], 16) / 255, parseInt(components[4], 16) / 255)
        }
    }

    updateViewport(width, height) {
        this._gl.viewport(0, 0, width, height);
    }

    getViewport() {
        return {width: this._canvas.width, height: this._canvas._height};
    }
    // endregion
};