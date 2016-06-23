/**
 * Created by Primoz on 18.5.2016.
 */

M3D.PointLight = class extends M3D.Light {

    constructor (color, intensity, distance, decay) {
        super(color, intensity);

        this.type = "PointLight";

        this._distance = ( distance !== undefined ) ? distance : 0;
        this._decay = ( decay !== undefined ) ? decay : 1;
    }

    set distance(dist) {
        this._distance = dist;

        // Notify onChange subscriber
        if (this._onChangeListener) {
            var update = {uuid: this._uuid, changes: {distance: this._distance}};
            this._onChangeListener.objectUpdate(update)
        }
    }
    set decay(dec) {
        this._decay = dec;

        // Notify onChange subscriber
        if (this._onChangeListener) {
            var update = {uuid: this._uuid, changes: {decay: this._decay}};
            this._onChangeListener.objectUpdate(update)
        }
    }

    get distance() { return this._distance; }
    get decay() { return this._decay; }

    toJson() {
        var obj = super.toJson();

        // Point light params
        obj.distance = this._distance;
        obj.intensity = this._decay;

        return obj;
    }

    static fromJson(data) {

        var light = new M3D.PointLight(data.color, data.intensity, data.distance, data.decay);

        // Light fromJson
        light = super.fromJson(data, light);

        return light;
    }

    update(data) {
        super.update(data);

        for (var prop in data) {
            switch(prop) {
                case "distance":
                    this._distance.set(data.distance);
                    delete data.distance;
                    break;
                case "decay":
                    this._decay = data.decay;
                    delete data.decay;
                    break;
            }
        }
    }
};