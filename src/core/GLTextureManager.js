/**
 * Created by Primoz on 25. 07. 2016.
 */

M3D.GLTextureManager = class {

    /**
     * @param {WebGLRenderingContext} gl WebGL rendering context used for buffer allocation.
     */
    constructor(gl) {
        this._gl = gl;
        this._cached_textures = new Map();

        this._colorClearFramebuffer = this._gl.createFramebuffer();
    }

    updateTexture(texture, isRTT) {

        let newTexture = false;

        // Check if the texture is already created and cached
        let glTexture = this._cached_textures.get(texture);

        // If texture was not found, create a new one and add it to the cached textures
        if (glTexture === undefined) {
            glTexture = this._gl.createTexture();
            this._cached_textures.set(texture, glTexture);
            newTexture = true;
        }

        // Check if the texture needs to be updated
        if (!texture.dirty) {
            return glTexture;
        }

        this._gl.bindTexture(this._gl.TEXTURE_2D, glTexture);

        this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, true);

        // Parse texture data
        let internalFormat = this._formatToGL(texture._internalFormat);
        let format = this._formatToGL(texture._format);
        let magFilter = this._magFilterToGL(texture._magFilter);
        let minFilter = this._minFilterToGL(texture._minFilter);
        let wrapS = this._wrapToGL(texture._wrapS);
        let wrapT = this._wrapToGL(texture._wrapT);
        let type = this._typeToGL(texture._type);
        let width = texture._width;
        let height = texture._height;

        // Filters
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, magFilter);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, minFilter);

        // Wrapping
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, wrapS);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, wrapT);

        // Generate mipmaps
        if (texture._generateMipmaps) {
            this._gl.generateMipmap(this._gl.TEXTURE_2D);
        }

        // If this texture is not a part of the RTT, load it from the image and unbind the texture.
        if (!isRTT) {
            // Normal texture
            if (texture.image === null) {
                this._gl.texImage2D(this._gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);
                //this.clearBoundTexture();
            }
            else {
                this._gl.texImage2D(this._gl.TEXTURE_2D, 0, internalFormat, format, type, texture.image);
            }
            this._gl.bindTexture(this._gl.TEXTURE_2D, null);
        }
        // Otherwise create empty texture (width * height) and leave the texture unbinding to function caller
        else {
            // RTT texture
            this._gl.texImage2D(this._gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);
        }


        texture._dirty = false;

        // Return created WebGL Texture
        return glTexture;
    }

    getTexture(reference) {
        return this._cached_textures.get(reference);
    }

    clearBoundTexture() {
        // Clear texture color
        let currentFramebuffer = this._gl.getParameter(this._gl.DRAW_FRAMEBUFFER_BINDING);
        let currentClearColor = this._gl.getParameter(this._gl.COLOR_CLEAR_VALUE);

        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._colorClearFramebuffer);
        this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0, this._gl.TEXTURE_2D, glTexture, 0);
        this._gl.drawBuffers([this._gl.COLOR_ATTACHMENT0]);

        this._gl.clearColor(0, 0, 0, 0);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT);

        this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0, this._gl.TEXTURE_2D, null, 0);
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, currentFramebuffer);
        this._gl.clearColor(currentClearColor[0], currentClearColor[1], currentClearColor[2], currentClearColor[3]);
    }

    clearTextures() {
        // Delete all cached textures
        for (var texture in this._cached_textures.values()) {
            this._gl.deleteTexture(texture);
        }

        // Clear map
        this._cached_textures.clear();
    }

    // region CONSTANT CONVERSION
    _formatToGL(format) {
        switch (format) {
            case M3D.Texture.RGBA:
                return this._gl.RGBA;
                break;
            case M3D.Texture.RGB:
                return this._gl.RGB;
                break;
            case M3D.Texture.ALPHA:
                return this._gl.ALPHA;
                break;
            case M3D.Texture.LUMINANCE:
                return this._gl.LUMINANCE;
                break;
            case M3D.Texture.LUMINANCE_ALPHA:
                return this._gl.LUMINANCE_ALPHA;
                break;
            case M3D.Texture.DEPTH_COMPONENT:
                return this._gl.DEPTH_COMPONENT;
                break;
            case M3D.Texture.DEPTH_COMPONENT24:
                return this._gl.DEPTH_COMPONENT24;
                break;
            case M3D.Texture.RGB16F:
                return this._gl.RGB16F;
                break;
            case M3D.Texture.RGB32F:
                return this._gl.RGB32F;
                break;
            case M3D.Texture.RGBA16F:
                return this._gl.RGBA16F;
                break;
            case M3D.Texture.RGBA32F:
                return this._gl.RGBA32F;
                break;
            default:
                console.log("Warning: Received unsupported texture format!");
                return this._gl.RGBA;
                break;
        }

    }

    _magFilterToGL(filter) {
        switch (filter) {
            case M3D.Texture.NearestFilter:
                return this._gl.NEAREST;
                break;
            case M3D.Texture.LinearFilter:
                return this._gl.LINEAR;
                break;
            default:
                console.log("Warning: Received unsupported texture filter!");
                return this._gl.LINEAR;
                break;
        }
    }

    _minFilterToGL(filter) {
        switch (filter) {
            case M3D.Texture.NearestFilter:
                return this._gl.NEAREST;
                break;
            case M3D.Texture.LinearFilter:
                return this._gl.LINEAR;
                break;
            case M3D.Texture.NearestMipMapNearestFilter:
                return this._gl.NEAREST_MIPMAP_NEAREST;
                break;
            case M3D.Texture.NearestMipMapLinearFilter:
                return this._gl.NEAREST_MIPMAP_LINEAR;
                break;
            case M3D.Texture.LinearMipMapNearestFilter:
                return this._gl.LINEAR_MIPMAP_NEAREST;
                break;
            case M3D.Texture.LinearMipMapLinearFilter:
                return this._gl.LINEAR_MIPMAP_LINEAR;
                break;
            default:
                console.log("Warning: Received unsupported texture filter!");
                return this._gl.LINEAR;
                break;
        }
    }

    _wrapToGL(wrap) {
        switch (wrap) {
            case M3D.Texture.RepeatWrapping:
                return this._gl.REPEAT;
                break;
            case M3D.Texture.ClampToEdgeWrapping:
                return this._gl.CLAMP_TO_EDGE;
                break;
            case M3D.Texture.MirroredRepeatWrapping:
                return this._gl.MIRRORED_REPEAT;
                break;
            default:
                console.log("Warning: Received unsupported texture filter!");
                return this._gl.CLAMP_TO_EDGE;
                break;
        }
    }

    _typeToGL(type) {
        switch (type) {
            case M3D.Texture.UNSIGNED_BYTE:
                return this._gl.UNSIGNED_BYTE;
                break;
            case M3D.Texture.UNSIGNED_INT_24_8:
                return this._gl.UNSIGNED_INT_24_8;
                break;
            case M3D.Texture.UNSIGNED_SHORT:
                return this._gl.UNSIGNED_SHORT;
                break;
            case M3D.Texture.UNSIGNED_INT:
                return this._gl.UNSIGNED_INT;
                break;
            case M3D.Texture.FLOAT:
                return this._gl.FLOAT;
                break;
            case M3D.Texture.HALF_FLOAT:
                return this._gl.HALF_FLOAT;
                break;
            default:
                console.log("Warning: Received unsupported texture type (using default)!");
                return this._gl.UNSIGNED_BYTE;
                break;
        }
    }
    // endregion
};