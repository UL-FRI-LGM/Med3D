
M3D.MeshPhongMaterial = class extends M3D.Material {

    constructor() {
        super(M3D.Material);

        this.type = "MeshPhongMaterial";

        // Diffuse
        this._color = new THREE.Color(0xffffff);
        this._specular = new THREE.Color(0x111111);
        this._shininess = 16;
        this._maps = [];
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

    get color() { return this._color; }
    get specular() { return this._specular; }
    get shininess() { return this._shininess; }
    get maps() { return this._maps; }


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

    requiredProgram() {
        // If the template is already generate use it
        if (this._requiredProgramTemplate !== null) {
            return this._requiredProgramTemplate;
        }

        // Create program specification
        var flags = [];
        var values = {};

        // Add texture flag
        if (this._maps.length > 0) {
            flags.push("TEXTURE");
            // Specify number of used textures
            values["NUM_TEX"] = this._maps.length;
        }
        else if (this._useVertexColors) {
            flags.push("VERTEX_COLORS");
        }

        return new M3D.MaterialProgramTemplate("phong", flags, values);
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