/**
 * Created by Primoz on 8. 11. 2016.
 */

M3D.CustomShaderMaterial = class extends M3D.Material {

    constructor() {
        super(M3D.Material);

        this.type = "CustomShaderMaterial";

        this._uniforms = {};
        this._fragmentS
    }

    set color(val) {
        this._color = val;

        // Notify onChange subscriber
        if (this._onChangeListener) {
            var update = {uuid: this._uuid, changes: {color: this._color.getHex()}};
            this._onChangeListener.materialUpdate(update)
        }
    }
    set specular(val) {
        this._specular = val;

        // Notify onChange subscriber
        if (this._onChangeListener) {
            var update = {uuid: this._uuid, changes: {specular: this._specular.getHex()}};
            this._onChangeListener.materialUpdate(update)
        }
    }
    set shininess(val) {
        this._shininess = val;

        // Notify onChange subscriber
        if (this._onChangeListener) {
            var update = {uuid: this._uuid, changes: {shininess: this._shininess}};
            this._onChangeListener.materialUpdate(update)
        }
    }

    set map(val) {
        // TODO: Enable texture sharing
        this._map = val;
    }

    get color() { return this._color; }
    get specular() { return this._specular; }
    get shininess() { return this._shininess; }
    get map() { return this._map; }

    requiredProgram() {
        var programName = "phong";

        if (this._map instanceof M3D.Texture) {
            programName += "_texture"
        }

        return programName;
    }

    toJson() {
        var obj = super.toJson();

        obj.color = this._color.getHex();
        obj.specular = this._specular.getHex();
        obj.shininess = this._shininess;

        return obj;
    }

    static fromJson(obj) {
        var material = new M3D.MeshPhongMaterial();

        // Material properties
        material = super.fromJson(obj, material);

        // MeshPhongMaterial properties
        material._color = new THREE.Color(obj.color);
        material._specular = new THREE.Color(obj.specular);
        material._shininess = obj.shininess;

        return material;
    }

    update(data) {
        super.update(data);

        for (var prop in data) {
            switch (prop) {
                case "color":
                    this._color.setHex(data.color);
                    delete data.color;
                    break;
                case "specular":
                    this._specular.setHex(data.specular);
                    delete data.specular;
                    break;
                case "shininess":
                    this._shininess = data.shininess;
                    delete data.shininess;
                    break;
            }
        }
    }
};