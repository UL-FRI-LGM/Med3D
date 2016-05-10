/**
 * Created by Primoz on 3.4.2016.
 */

M3D.Material = function () {

    Object.defineProperty( this, 'id', { value: M3D.MaterialIdCount ++ } );

    this.uuid = THREE.Math.generateUUID();

    this.name = '';
    this.type = 'Material';

    // Defines which of the face sides will be rendered - front, back or both
    this.side = M3D.FrontSide;

    // Is transparent
    this.transparent = false;
    // 0.0f fully transparent 1.0f if fully opaque
    this.opacity = 1;

    // Whether to have depth test enabled when rendering this material
    this.depthTest = true;
    // Whether rendering this material has any effect on the depth buffer
    this.depthWrite = true;
    this.colorWrite = true;

    this.visible = true;

    this._needsUpdate = true;

    this.program = M3D.GL2_PROGRAM_BASIC;
};

M3D.Material.prototype = {

    constructor: M3D.Material,

    get needsUpdate() {
        return this._needsUpdate;
    },

    set needsUpdate(value) {
        this._needsUpdate = value;
    }
};

M3D.MaterialIdCount = 0;