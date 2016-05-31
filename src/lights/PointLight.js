/**
 * Created by Primoz on 18.5.2016.
 */

M3D.PointLight = class extends M3D.Light {

    constructor (color, intensity, distance, decay) {
        super(color, intensity);

        this._distance = ( distance !== undefined ) ? distance : 0;
        this._decay = ( decay !== undefined ) ? decay : 1;
    }

    set distance(dist) { this._distance = dist; }
    set decay(dec) { this._decay = dec; }

    get distance() { return this._distance; }
    get decay() { return this._decay; }
};