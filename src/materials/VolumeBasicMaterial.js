/**
 * Created by lanab on 18-Apr-17.
 */

M3D.VolumeBasicMaterial = class extends M3D.Material {

    constructor() {
        super(M3D.Material);

        this.type = "VolumeBasicMaterial";

        this._color = new THREE.Color(0xff0000); // emissive
        this._maps = [];

        // Is affected by lights
        this._lights = true;
    }

    set color(val) {
        if (!val.equals(this._color)) {
            this._color = val;

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {color: this._color.getHex()}};
                this._onChangeListener.materialUpdate(update)
            }
        }
    }

    set lights(val) {
        if (this._lights !== val) {
            // Invalidate required program template
            this._requiredProgramTemplate = null;

            this._lights = val;

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {lights: this._lights}};
                this._onChangeListener.materialUpdate(update)
            }
        }
    }

    get color() { return this._color; }
    get maps() { return this._maps; }
    get lights() { return this._lights; }

    // region MAP MANAGEMENT
    addMap(map) {
        // Invalidate required program template
        this._requiredProgramTemplate = null;

        this._maps.push(map)
    }

    removeMap(map) {
        let index = this._maps.indexOf(map);

        if (index > -1) {
            // Invalidate required program template
            this._requiredProgramTemplate = null;

            this._maps.splice(index, 1);
        }
    }

    clearMaps() {
        // Invalidate required program template
        this._requiredProgramTemplate = null;

        this._maps = [];
    }
    // endregion

    requiredProgram() {
        // If the template is already generate use it
        if (this._requiredProgramTemplate !== null) {
            return this._requiredProgramTemplate;
        }

        // Create program specification
        let flags = [];
        let values = {};

        if (this._lights) {
            flags.push("LIGHTS");
        }

        if (this._maps.length > 0) {
            flags.push("TEXTURE");
            // Specify number of used textures
            values["NUM_TEX"] = this._maps.length;
        }

        return new M3D.MaterialProgramTemplate("basicVolume", flags, values);
    }

    toJson() {
        var obj = super.toJson();

        obj.color = this._color.getHex();
        obj.lights = this._lights;

        return obj;
    }

    static fromJson(obj) {
        var material = new M3D.MeshBasicMaterial();

        // Material properties
        material = super.fromJson(obj, material);

        // MeshBasicMaterial properties
        material._color = new THREE.Color(obj.color);
        material._lights = obj.lights;

        return material;
    }

    update(data) {
        super.update(data);

        for (var prop in data) {
            switch (prop) {
                case "color":
                    this._color = data.color;
                    delete data.color;
                    break;
                case "lights":
                    this._lights = data.lights;
                    delete data.lights;
                    break;
            }
        }
    }
};