/**
 * Created by Primoz on 25.7.2016.
 */

M3D.RenderTarget = class {

    constructor(width, height, options = {}) {
        this._uuid = THREE.Math.generateUUID();
        this.type = "RenderTarget";

        this._width = width;
        this._height = height;

        this._viewport = new THREE.Vector4( 0, 0, width, height );

        // Create empty texture
        this._texture = new M3D.Texture(undefined, options.wrapS, options.wrapT, options.magFilter, options.minFilter, options.format);
    }

    get texture() { return this._texture; }

};