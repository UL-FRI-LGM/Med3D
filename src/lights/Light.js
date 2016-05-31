/**
 * Created by primoz on 18.5.2016.
 */

M3D.Light = class extends M3D.Object3D {

    constructor(color, intensity) {
        super(M3D.Object3D);

        this._color = new THREE.Color(color);
        this._intensity  = intensity !== undefined ? intensity : 1;
    }

    get color () { return this._color; }
    get intensity () { return this._intensity; }
    set color (col) { this._color = col; }
    set intensity (inten) { this._intensity = inten; }
};