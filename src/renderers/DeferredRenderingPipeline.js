/**
 * Created by Primoz on 1. 11. 2016.
 */

M3D.DeferredRenderingPipeline = class {

    /**
     * This implementation of deferred rendering pipeline enqueues sequence of render passes that render the data to
     * texture. Each render pass receives textures passed through from the previous render passes in the pre-processing
     * step which allows additional
     */

    constructor (renderer) {

        this._renderer = renderer;

        // Render Pass
        // Type of the render pass
        this.TYPE_RTT = 0;
        this.TYPE_TEXTURE_MERGE = 1;

        // Rendering sequences that are used often can be stored for quick access
        this._storedRenderQueues = {};

        // Queue for render passes. When render() is called this queue is executed in FIFO order
        this._renderQueue = [];

        // Objects for inter render pass parameter passing
        this._currentPassTextures = {};
        this._currentPassAdditionalData = {};
    }

    /**
        RENDER PASS TEMPLATE
        var renderPass = {
            type: TYPE,                       // Specifies the type of the rendering pass:
                                              //       TYPE_RTT           - Render To Texture
                                              //       TYPE_TEXTURE_MERGE - Texture merge using the merging fragment shader

            preprocessing: FUNCTION,          // Pre-processing function passed as: function (textures, additionalData) -> [scene, camera, textureID] | [...textureID-s])
                                              // Receives textures and additionalData produced and outputted in the previous steps of the pipeline.
                                              // In case of TYPE_RTT this function should return scene, camera and target texture ID.
                                              // In case of TYPE_TEXTURE_MERGE this function should return list of id-s specifying the input textures for the merge

            rtt_configuration:                // Render to texture texture configuration. (Optional but suggested)

            shader: SHADER                    // Custom fragment shader used after pre-processing step(optional when type == TYPE_RTT)
        };
    */

    /**
     * Use this function to enqueue new render pass in the deferred rendering pipeline queue.
     * @param renderPass {object} Render pass should be specified as defined by the render pass template.
     */
    enqueueRenderPass(renderPass) {
        // Check if type is specified
        if (!renderPass.hasOwnProperty("type")) {
            console.error("Error: Tried to add render pass without a type.");
            return;
        }

        // Check for pre-processing function
        if (!renderPass.hasOwnProperty("preprocessing") || typeof renderPass.preprocessing !== "function") {
            console.error("Error: Tried to add render pass with invalid pre-processing parameter.");
            return;
        }

        if (renderPass.type === this.TYPE_TEXTURE_MERGE && !renderPass.hasOwnProperty("mergeShader")) {
            console.error("Error: Tried to add texture merge without specifying the shader.");
            return;
        }

        // Create render target for RTT
        if (renderPass.type === this.TYPE_RTT) {
            renderPass._renderTarget = new M3D.RenderTarget(renderPass.rtt_configuration.width, renderPass.rtt_configuration.height, rtt_configuration);
        }

        // Add to queue
        this._renderQueue.push(renderPass);
    }

    render() {
        var preprocData;

        for (var renderPass in this._renderQueue) {


            // TODO: Should we implement error checking?
            if (renderPass.type === TYPE_RTT) {
                // Execute pre-processing step
                preprocData = renderPass.preprocessing(this._currentPassTextures, this._currentPassAdditionalData);

                this._currentPassTextures[preprocData[3]] = renderPass.renderPassTextures

                this._renderer.render(preprocData[0], preprocData[1])
            }
            else {

            }
        }
    }

    /**
     * Stores currently setup render queue.
     * @param id {string} Identificator through which the stored render queue will be accessible.
     */
    storeRenderQueue(id) {
        this._storedRenderQueues[id] = this._renderQueue;
    }

    loadRenderQueue(id) {
        var queue = this._storedRenderQueues[id];

        if (queue === undefined) {
            console.error("Error: Could not find the requested queue.")
        }
    }

    clearRenderQueue() {
        this._renderQueue = [];
    }
};