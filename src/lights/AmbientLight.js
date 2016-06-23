/**
 * Created by Primoz on 18.5.2016.
 */

M3D.AmbientLight = class extends M3D.Light {

    constructor (color, intensity) {
        super(color, intensity);

        this.type = "AmbientLight";
    }

    static fromJson(data) {

        var light = new M3D.AmbientLight(data.color, data.intensity);

        // Light fromJson
        light = super.fromJson(data, light);

        return light;
    }


};