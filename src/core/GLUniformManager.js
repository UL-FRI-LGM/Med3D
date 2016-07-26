/**
 * Created by Primoz on 25. 07. 2016.
 */

M3D.GLUnifromManager = class {

    /**
     * @param {WebGLRenderingContext} gl WebGL rendering context used for buffer allocation.
     */
    constructor(gl) {
        this._gl = gl;
        this._cached_uniforms = new Map();
    }

    updateTexture(texture, renderTarget) {

        var texUniform = this._cached_uniforms.get(texture);

        // Check if the texture needs to be updated
        if (!texture.dirty && texUniform !== undefined) {
            return;
        }

        if (texUniform === undefined) {
            // Create new texture
            texUniform = this._gl.createTexture();
            this._cached_uniforms.set(texture, texUniform);
        }

        this._gl.bindTexture(this._gl.TEXTURE_2D, texUniform);

        this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, true);

        // Parse texture format
        var format = this._formatToGL(texture._format);

        // Filters
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._magFilterToGL(texture._magFilter));
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._minFilterToGL(texture._minFilter));

        // Wrapping
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._wrapToGL(texture._wrapS));
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._wrapToGL(texture._wrapT));

        // Generate mipmaps
        if (texture._generateMipmaps) {
            this._gl.generateMipmap(this._gl.TEXTURE_2D);
        }

        if (!renderTarget) {
            // Normal texture
            this._gl.texImage2D(this._gl.TEXTURE_2D, 0, format, format, this._gl.UNSIGNED_BYTE, texture.image);
        }
        else {
            // RTT texture
            this._gl.texImage2D(this._gl.TEXTURE_2D, 0, format, renderTarget._width, renderTarget._height, 0, format, this._gl.UNSIGNED_BYTE, null);

            // Initialize render buffer
            var renderbuffer = this._gl.createRenderbuffer();
            this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, renderbuffer);
            this._gl.renderbufferStorage(this._gl.RENDERBUFFER, this._gl.DEPTH_COMPONENT16, renderTarget._width, renderTarget._height);
            this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0, this._gl.TEXTURE_2D, texUniform, 0);
            this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT, this._gl.RENDERBUFFER, renderbuffer);
            this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, null);
        }

        this._gl.bindTexture(this._gl.TEXTURE_2D, null);

        texture._dirty = false;
    }

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

    _wrapToGL(filter) {
        switch (filter) {
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

    getUniform(reference) {
        return this._cached_uniforms.get(reference);
    }

    clearUniforms() {
        this._cached_uniforms.clear();
    }
};