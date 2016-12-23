/**
 * Created by Primoz on 26-Nov-16.
 */

M3D.RenderPass = class {

    constructor(type, initialize, preprocess, target, viewport, outDepthID = null, outTextures = []) {

        /**
         * Can be either:
         * M3D.RenderPass.BASIC - Requires a preprocess function to return array [M3D.Scene, M3D.Camera]. Performs basic render pass
         *                        with the given scene and camera rendering to either Texture or Screen (defined by the target).
         *
         * M3D.RenderPass.TEXTURE_MERGE - Requires a preprocess function to return array [M3D.CustomShaderMaterial, [M3D.Texture,..]].
         *                                It then uses the given M3D.CustomShaderMaterial to merge the given textures using (rendering is done on quad).
         */
        this._type = type;

        /**
         * This is set to true by RenderQueue after the initialize step is executed.
         */
        this._isInitialized = false;

        /**
         * This function is called only once, when the render pass in executed for the first time. In this step you can initialize scene, textures..
         */
        this._initialize = initialize;

        /**
         * This function is called before the rendering with two parameters (PreviousRPTextures, PreviousRPData). And it should return
         * either an object {scene: M3D.Scene, camera: M3D.Camera} (for RenderPass.BASIC) or {material: M3D.CustomShaderMaterial, textures: [M3D.Texture,..]} (for RenderPass.TEXTURE_MERGE).
         */
        this._preprocess = preprocess;

        /**
         * Specifies if the render pass should render to texture (RenderPass.TEXTURE) or directly to screen (RenderPass.SCREEN)
         */
        this._target = target;

        /**
         * Viewport of render pass
         */
        this._viewport = viewport;

        /**
         * String ID to which output texture will be bound. If null is specified as the ID the depth texture will not be rendered.
         */
        this._outDepthID = outDepthID;

        /**
         * Array of templates (order important) for output textures, COLOR_ATTACHMENTS (when using target TEXTURE).
         * Template format:
         *      {
         *          id: string,
         *          textureConfig: {wrapS, WrapT, minFilter, magFilter, internalFormat, format, type}
         *      }
         * For the texture config parameters refer to M3D.Texture class and
         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
         * for format and type explanation.
         */
        this._outTextures = outTextures;
    }

    get type() {
        return this._type;
    }
    get initialize() {
        return this._initialize;
    }
    get preprocess() {
        return this._preprocess;
    }
    get target() {
        return this._target;
    }
    get viewport() {
        return this._viewport;
    }
    get outDepthID() {
        return this._outDepthID;
    }
    get outTextures() {
        return this._outTextures;
    }


    set type(value) {
        this._type = value;
    }
    set initialize(value) {
        this._initialize = value;
    }
    set preprocess(value) {
        this._preprocess = value;
    }
    set target(value) {
        this._target = value;
    }
    set viewport(value) {
        this._viewport = value;
    }
    set outDepthID(value) {
        if (this._type === M3D.RenderPass.SCREEN) {
            console.warn("Warning: Setting output depth texture to RenderPass that renders to screen!")
        }

        this._outDepthID = value;
    }
    set outTextures(value) {
        if (this._type === M3D.RenderPass.SCREEN) {
            console.warn("Warning: Setting output color textures to RenderPass that renders to screen!")
        }

        this._outTextures = value;
    }
};

// Render pass types
M3D.RenderPass.BASIC = 0;
M3D.RenderPass.TEXTURE_MERGE = 1;

// Render pass target
M3D.RenderPass.TEXTURE = 2;
M3D.RenderPass.SCREEN = 3;

M3D.RenderPass.DEFAULT_RGBA_TEXTURE_CONFIG = {wrapS: M3D.Texture.ClampToEdgeWrapping,
                                                wrapT: M3D.Texture.ClampToEdgeWrapping,
                                                minFilter: M3D.Texture.LinearFilter,
                                                magFilter: M3D.Texture.LinearFilter,
                                                internalFormat: M3D.Texture.RGBA,
                                                format: M3D.Texture.RGBA,
                                                type: M3D.Texture.UNSIGNED_BYTE};


M3D.RenderPass.FLOAT_RGB_TEXTURE_CONFIG = {wrapS: M3D.Texture.ClampToEdgeWrapping,
    wrapT: M3D.Texture.ClampToEdgeWrapping,
    minFilter: M3D.Texture.LinearFilter,
    magFilter: M3D.Texture.LinearFilter,
    internalFormat: M3D.Texture.RGBA16F,
    format: M3D.Texture.RGBA,
    type: M3D.Texture.HALF_FLOAT};



M3D.RenderPass.DEFAULT_RGB_TEXTURE_CONFIG = {wrapS: M3D.Texture.ClampToEdgeWrapping,
                                                wrapT: M3D.Texture.ClampToEdgeWrapping,
                                                minFilter: M3D.Texture.LinearFilter,
                                                magFilter: M3D.Texture.LinearFilter,
                                                internalFormat: M3D.Texture.RGB,
                                                format: M3D.Texture.RGB,
                                                type: M3D.Texture.UNSIGNED_BYTE};
