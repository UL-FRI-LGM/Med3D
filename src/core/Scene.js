/**
 * Created by Primoz on 27. 03. 2016.
 */

M3D.Scene = class extends M3D.Object3D {

    constructor() {
        super(M3D.Object3D);
        this.autoUpdate = true; // checked by the renderer
    }
};
