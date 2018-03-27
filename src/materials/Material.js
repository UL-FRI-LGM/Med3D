/**
 * Created by Primoz on 3.4.2016.
 */

M3D.Material = class {

    constructor() {

        if (new.target === M3D.Material) {
            throw new TypeError("Cannot construct abstract Material class.");
        }

        this._uuid = THREE.Math.generateUUID();
        this.type = "Material";

        this._onChangeListener = null;

        this._name = '';

        // Defines which of the face sides will be rendered - front, back or both
        this._side = M3D.FRONT_AND_BACK_SIDE;

        this._depthFunc = M3D.FUNC_LEQUAL;
        this._depthTest = true;
        this._depthWrite = true;

        // Is transparent
        this._transparent = false;

        // 0.0f fully transparent 1.0f if fully opaque
        this._opacity = 1;

        // Should use vertex colors
        this._useVertexColors = false;

        // Shader program template
        this._requiredProgramTemplate = null;
    }

    set name(val) {
        if (val !== this._name) {
            this._name = val;

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {name: this._name}};
                this._onChangeListener.materialUpdate(update)
            }
        }
    }

    set side(val) {
        if (val !== this._side) {
            this._side = val;

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {side: this._side}};
                this._onChangeListener.materialUpdate(update)
            }
        }
    }

    set depthFunc(val) {
        if (val !== this._depthFunc) {
            this._depthFunc = val;

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {depthFunc: this._depthFunc}};
                this._onChangeListener.materialUpdate(update)
            }
        }
    }

    set depthTest(val) {
        if (val !== this._depthTest) {
            this._depthTest = val;

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {depthTest: this._depthTest}};
                this._onChangeListener.materialUpdate(update)
            }
        }
    }

    set depthWrite(val) {
        if (val !== this._depthWrite) {
            this._depthWrite = val;

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {depthWrite: this._depthWrite}};
                this._onChangeListener.materialUpdate(update)
            }
        }
    }

    set transparent(val) {
        if (val !== this._transparent) {
            this._transparent = val;

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {transparent: this._transparent}};
                this._onChangeListener.materialUpdate(update)
            }
        }
    }

    set opacity(val) {
        if (val !== this._opacity) {
            this._opacity = val;

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {opacity: this._opacity}};
                this._onChangeListener.materialUpdate(update)
            }
        }
    }

    set useVertexColors(val) {
        if (val !== this._useVertexColors) {
            // Invalidate required program template
            this._requiredProgramTemplate = null;

            this._useVertexColors = val;

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {useVertexColors: this._useVertexColors}};
                this._onChangeListener.materialUpdate(update)
            }
        }
    }

    set onChangeListener(listener) { this._onChangeListener = listener; }

    get name() { return this._name; }
    get side() { return this._side; }
    get depthFunc() { return this._depthFunc; }
    get depthTest() { return this._depthTest; }
    get depthWrite() { return this._depthWrite; }
    get transparent() { return this._transparent; }
    get opacity() { return this._opacity; }
    get useVertexColors() { return this._useVertexColors; }


    toJson() {
        var obj = {};

        // Meta
        obj._uuid = this._uuid;
        obj.type = this.type;
        obj.name = this._name;

        // Culled side
        obj.side = this._side;

        // Depth test related parameters
        obj.depthFunc = this._depthFunc;
        obj.depthTest = this._depthTest;
        obj.depthWrite = this._depthWrite;

        // Visibility parameters
        obj.transparent = this._transparent;
        obj.opacity = this._opacity;

        // Color
        obj.useVertexColors = this._useVertexColors;

        return obj;
    }

    static fromJson(obj, material) {
        if (!material) {
            var material = new M3D.Material();
        }

        // Meta
        material._uuid = obj._uuid;
        material._name = obj.name;

        // Culled side
        material._side = obj.side;

        // Depth test related parameters
        material._depthFunc = obj.depthFunc;
        material._depthTest = obj.depthTest;
        material._depthWrite = obj.depthWrite;

        // Visibility parameters
        material._transparent = obj.transparent;
        material._opacity = obj.opacity;

        // Color
        material._useVertexColors = obj.useVertexColors

        return material;
    }

    update(data) {
        for (var prop in data) {
            switch (prop) {
                case "opacity":
                    this._opacity = data.opacity;
                    delete data.opacity;
                    break;
                case "transparent":
                    this._transparent = data.transparent;
                    delete data.transparent;
                    break;
                case "side":
                    this._side = data.side;
                    delete data.side;
                    break;
                case "depthFunc":
                    this._depthFunc = data.depthFunc;
                    delete data.depthFunc;
                    break;
                case "depthTest":
                    this._depthTest = data.depthTest;
                    delete data.depthTest;
                    break;
                case "depthWrite":
                    this._depthWrite = data.depthWrite;
                    delete data.depthWrite;
                    break;
                case "useVertexColors":
                    this._useVertexColors = data.useVertexColors;
                    delete data.useVertexColors;
                    break;
                case "name":
                    this._name = data.name;
                    delete data.name;
                    break;

            }
        }
    }
};