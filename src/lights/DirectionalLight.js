/**
 * Created by Primoz on 18.5.2016.
 */

M3D.DirectionalLight = class extends M3D.Light {

    constructor(color, intensity) {
        super(color, intensity);

        this.type = "DirectionalLight";

        // Direction
        this._position.set( 0, 1, 0 );

        this.updateMatrix();
    }

    // toJson >> Nothing to add

    static fromJson(data) {

        var light = new M3D.DirectionalLight(data.color, data.intensity);

        // Light fromJson
        light = super.fromJson(data, light);

        return light;
    }
};