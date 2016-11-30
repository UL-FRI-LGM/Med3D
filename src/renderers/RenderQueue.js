/**
 * Created by Primoz on 26-Nov-16.
 */

M3D.RenderQueue = class {

    constructor(renderer) {
        this._renderer = renderer;

        // Rendering sequences that are used often can be stored for quick access
        this._storedRenderQueues = {};

        // Queue for render passes. When render() is called this queue is executed in FIFO order
        this._renderQueue = [];

        // Maps ID (string) to texture
        this._textureMap = {};

        // Init merge texture resources
        this._textureMergeScene = new M3D.Scene();
        this._textureMergeQuad = new M3D.Quad(new THREE.Vector2(-1, 1), new THREE.Vector2(1, -1), new M3D.MeshBasicMaterial());
        this._textureMergeQuad.frustumCulled = false;
        this._textureMergeCamera = new M3D.OrthographicCamera(-1, 1, 1, -1, 1, 2);

        this._textureMergeScene.add(this._textureMergeQuad);

        // Init render target
        this._renderTarget = new M3D.RenderTarget(1920, 1080);
    }

    _setupRenderTarget(renderPass) {
        let viewportRP = renderPass.viewport;

        // Clear previous draw buffers from the render target
        this._renderTarget.clearDrawBuffers();

        // Set viewport dimensions
        this._renderTarget.width = viewportRP.width;
        this._renderTarget.height = viewportRP.height;

        // Check if depth texture is requested
        if (renderPass.outDepthID !== null) {
            let cachedTexture = this._textureMap[renderPass.outDepthID];

            // If texture with this ID is already cached use that texture
            if (cachedTexture !== undefined) {
                this._renderTarget.depthTexture = cachedTexture;
            }
            else {
                this._renderTarget.addDepthTexture();
                // Bind depth texture to ID
                this._textureMap[renderPass.outDepthID] = this._renderTarget.depthTexture;
            }
        }

        // Bind color output textures
        for (let i = 0; i < renderPass.outTextures.length; i++) {

            let texTemplate = renderPass.outTextures[i];
            let texID = texTemplate.id;
            let texConfig = texTemplate.textureConfig;

            // Check if this texture is already cached
            let cachedTexture = this._textureMap[texID];

            // If texture with this ID is already cached use that texture
            if (cachedTexture !== undefined) {
                // Update texture parameters
                cachedTexture.wrapS = texConfig.wrapS;
                cachedTexture.wrapT = texConfig.wrapT;
                cachedTexture.minFilter = texConfig.minFilter;
                cachedTexture.magFilter = texConfig.magFilter;
                cachedTexture.internalFormat = texConfig.internalFormat;
                cachedTexture.format = texConfig.format;
                cachedTexture.type = texConfig.type;
                cachedTexture.width = texConfig.width;
                cachedTexture.height = texConfig.height;

                // Add texture ass draw buffer to render target
                this._renderTarget.addDrawBuffer(cachedTexture);
            }
            else {
                // Create new texture
                let texture = new M3D.Texture(undefined, texConfig.wrapS, texConfig.wrapT, texConfig.minFilter, texConfig.magFilter,
                    texConfig.internalFormat, texConfig.format, texConfig.type, texConfig.width, texConfig.height);

                this._renderTarget.addDrawBuffer(texture);
                // Bind depth texture to the given ID ID
                this._textureMap[texID] = texture;
            }
        }
    }

    render() {
        // Additional data passed through by previous render passes
        let forwardedAdditionalData = {};

        // Store current renderer viewport
        let cleanupViewport = this._renderer.getViewport();

        for (let i = 0; i < this._renderQueue.length; i++) {
            let renderPass = this._renderQueue[i];
            let viewportRP = renderPass.viewport;

            // Execute preprocess step
            let preprocOutput = renderPass.preprocess(this._textureMap, forwardedAdditionalData);

            // Determine the render pass type
            if (renderPass.type === M3D.RenderPass.BASIC) {
                // This is a BASIC scene rendering render pass

                // Validate preprocess output
                if (preprocOutput.scene === undefined || !(preprocOutput.scene instanceof M3D.Scene) ||
                    preprocOutput.camera === undefined || !(preprocOutput.camera instanceof M3D.Camera)) {
                    console.error("Render pass " + i + " has invalid preprocess output!");
                    return;
                }

                // Render to specified target
                if (renderPass.target === M3D.RenderPass.SCREEN) {
                    // RENDER TO SCREEN
                    // Set requested viewport
                    this._renderer.updateViewport(viewportRP.width, viewportRP.height);

                    // Render to screen
                    this._renderer.render(preprocOutput.scene, preprocOutput.camera);
                }
                else if (renderPass.target === M3D.RenderPass.TEXTURE) {
                    // RENDER TO TEXTURE
                    // Setup render target as the render pass specifies
                    this._setupRenderTarget(renderPass);

                    // Render to render target
                    this._renderer.render(preprocOutput.scene, preprocOutput.camera, this._renderTarget)
                }
                else {
                    console.error("Unknown render pass " + i + " target.")
                    return;
                }
            }
            else if (renderPass.type === M3D.RenderPass.TEXTURE_MERGE) {
                // This is a texture merging render pass

                // Validate preprocess output
                if (preprocOutput.material === undefined || !(preprocOutput.material instanceof M3D.CustomShaderMaterial) ||
                    preprocOutput.textures === undefined || !Array.isArray(preprocOutput.textures)) {
                    console.error("Render pass " + i + " has invalid preprocess output!");
                    return;
                }

                // Remove possible previous maps
                preprocOutput.material.clearMaps();

                // Add textures to material
                for (let i = 0; i < preprocOutput.textures.length; i++) {
                    preprocOutput.material.addMap(preprocOutput.textures[i]);
                }

                // Set quad material so that the correct shader will be used
                this._textureMergeQuad.material = preprocOutput.material;

                // Render to specified target
                if (renderPass.target === M3D.RenderPass.SCREEN) {
                    // RENDER TO SCREEN
                    // Set requested viewport
                    this._renderer.updateViewport(viewportRP.width, viewportRP.height);

                    // Render to screen
                    this._renderer.render(this._textureMergeScene, this._textureMergeCamera);
                }
                else if (renderPass.target === M3D.RenderPass.TEXTURE) {
                    // RENDER TO TEXTURE
                    // Setup render target as the render pass specifies
                    this._setupRenderTarget(renderPass);

                    // Render to render target
                    this._renderer.render(this._textureMergeScene, this._textureMergeCamera, this._renderTarget)
                }
                else {
                    console.error("Unknown render pass " + i + " target.")
                    return;
                }
            }
            else {
                console.error("Render queue contains RenderPass of unsupported type!")
                return;
            }
        }

        // Restore viewport to original value
        this._renderer.updateViewport(cleanupViewport.width, cleanupViewport.height);
    }

    // region QUEUE CONSTRUCTION
    /**
     * Creates the render queue from the given array of render passes
     */
    setRenderQueue(queue) {
        // Validate the given queue
        for (let i = 0; i < queue.length; i++) {
            if (!(queue[i] instanceof M3D.RenderPass)) {
                console.error("Given render queue contains invalid elements!");
                return;
            }
        }

        this._renderQueue = queue;
    }

    /**
     * Removes all the RenderPasses from the queue
     */
    clearRenderQueue() {
        this._renderQueue = [];
    }

    /**
     * Adds new M3D.RenderPass to the end of the queue
     */
    pushRenderPass(renderPass) {
        // Validate renderPass
        if (!(renderPass instanceof M3D.RenderPass)) {
            console.error("Given argument is not a RenderPass!");
            return;
        }

        this._renderQueue.push(renderPass);
    }

    /**
     * Pops last render pass in the render queue
     */
    popRenderPass() {
        return this._renderQueue.pop();
    }
    // endregion

    // region QUEUE MANAGEMENT
    /**
     * Stores currently setup render queue.
     * @param id {string} Identificator through which the stored render queue will be accessible.
     */
    storeRenderQueue(id) {
        this._storedRenderQueues[id] = this._renderQueue;
    }

    loadRenderQueue(id) {
        let queue = this._storedRenderQueues[id];

        if (queue === undefined) {
            console.error("Error: Could not find the requested queue.")
        }
        else {
            this._renderQueue = queue;
        }
    }
    // endregion
};