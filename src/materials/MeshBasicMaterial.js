/**
 * Created by Primoz on 4.4.2016.
 */

M3D.MeshBasicMaterial = class extends M3D.Material {

    constructor() {
        super(M3D.Material);

        this.type = "MeshBasicMaterial";

        this._color = new THREE.Color(0xffffff); // emissive
        this._map = null;

        this._lights = true;
    }

    set color(val) {
        this._color = val;

        // Notify onChange subscriber
        if (this._onChangeListener) {
            var update = {uuid: this._uuid, changes: {color: this._color.getHex()}};
            this._onChangeListener.materialUpdate(update)
        }
    }
    set map(val) {
        this._map = val;

        if (this._map !== null) {
            this._program[2] = "_texture";
        }
        else {
            this._program[2] = "";
        }
    }
    set lights(val) {
        this._lights = val;

        if (this._lights) {
            this._program[1] = "_lights";
        }
        else {
            this._program[1] = "";
        }
    }

    get color() { return this._color; }
    get map() { return this._map; }
    get lights() { return this._lights; }

    requiredProgram() {
        var programName = "basic";

        if (this._lights) {
            programName += "_lights";
        }

        if (this._map instanceof M3D.Texture) {
            programName += "_texture"
        }

        if (this._useVertexColors) {
            programName += "_colors"
        }

        return programName;
    }

    toJson() {
        var obj = super.toJson();

        obj.color = this._color.getHex();
        obj.program = this.program;

        return obj;
    }

    static fromJson(obj) {
        var material = new M3D.MeshBasicMaterial();

        // Material properties
        var material = super.fromJson(obj, material);

        // MeshBasicMaterial properties
        material._color = new THREE.Color(obj.color);
        material._program = obj.program;

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
            }
        }
    }
};