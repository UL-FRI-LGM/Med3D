/**
 * Created by Primoz on 25.7.2016.
 */

M3D.RenderTarget = class {

    constructor(width, height) {
        this._uuid = THREE.Math.generateUUID();
        this.type = "RenderTarget";

        this._width = (width !== undefined) ? width : 800;
        this._height = (height !== undefined) ? height : 600;

        this._viewport = new THREE.Vector4( 0, 0, width, height );

        // Framebuffer color attachments (textures) - Order is important
        this._drawBuffers = [];

        // Depth texture (if null then depth texture wont be fetched)
        this._depthTexture = null;
    }

    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    get depthTexture() {
        return this._depthTexture;
    }

    set width(width) {
        this._width = width;
        // Update viewport
        this._viewport = new THREE.Vector4(0, 0, this._width, this._height);
    }
    set height(height) {
        this._height = height;
        // Update viewport
        this._viewport = new THREE.Vector4(0, 0, this._width, this._height);
    }

    set depthTexture(texture) {
        this._depthTexture = texture;
    }

    addDepthTexture() {
        this._depthTexture = new M3D.Texture(undefined, M3D.Texture.ClampToEdgeWrapping, M3D.Texture.ClampToEdgeWrapping,
            M3D.Texture.NearestFilter, M3D.Texture.NearestFilter, M3D.Texture.DEPTH_COMPONENT24, M3D.Texture.DEPTH_COMPONENT, M3D.Texture.UNSIGNED_INT, this._width, this._height);
    }

    rmDepthTexture() {
        this._depthTexture = null;
    }

    addDrawBuffer(texture) {
        this._drawBuffers.push(texture);
    }

    rmDrawBuffer(idx) {
        return this._drawBuffers.splice(idx, 1);
    }

    getDrawBuffer(idx) {
        return this._drawBuffers[idx];
    }

    sizeDrawBuffers() {
        return this._drawBuffers.length;
    }

    clearDrawBuffers() {
        this._drawBuffers = [];
    }
};