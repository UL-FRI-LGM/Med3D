
M3D.MeshPhongMaterial = class extends M3D.Material {

    constructor() {
        super(M3D.Material);

        this.type = "MeshPhongMaterial";

        // Diffuse
        this._color = new THREE.Color(0xffffff);
        this._specular = new THREE.Color(0x111111);
        this._shininess = 16;

        this._program = "phong";
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
        this._specular = val;

        // Notify onChange subscriber
        if (this._onChangeListener) {
            var update = {uuid: this._uuid, changes: {shininess: this._shininess}};
            this._onChangeListener.materialUpdate(update)
        }
    }

    get color() { return this._color; }
    get specular() { return this._specular; }
    get shininess() { return this._shininess; }

    toJson() {
        var obj = super.toJson();

        obj.color = this._color.getHex();
        obj.specular = this._specular.getHex();
        obj.shininess = this._shininess;

        obj.program = this._program;

        return obj;
    }

    static fromJson(obj) {
        var material = new M3D.MeshPhongMaterial();

        // Material properties
        var material = super.fromJson(obj, material);

        // MeshPhongMaterial properties
        material._color = new THREE.Color(obj.color);
        material._specular = new THREE.Color(obj.specular);
        material._shininess = obj.shininess;


        material._program = obj.program;

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