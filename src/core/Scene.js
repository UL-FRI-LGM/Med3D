/**
 * Created by Primoz on 27. 03. 2016.
 */

M3D.Scene = class extends M3D.Object3D {

    constructor() {
        this.type = 'Scene';

        this.overrideMaterial = null;

        this.autoUpdate = true; // checked by the renderer
    }
};
