/**
 * Created by Primoz on 3.4.2016.
 */

M3D.Material = class {

    constructor() {

        this._uuid = THREE.Math.generateUUID();
        this.type = "Material";

        this._onChangeListener = null;

        this._name = '';

        // Defines which of the face sides will be rendered - front, back or both
        this._side = M3D.FRONT_SIDE;

        this._depthFunc = M3D.FUNC_LEQUAL;
        this._depthTest = true;
        this._depthWrite = true;

        // Is transparent
        this._transparent = false;

        // 0.0f fully transparent 1.0f if fully opaque
        this._opacity = 1;

        this._visible = true;

        // Program used for rendering
        this._program = "basic";
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

    set visible(val) {
        if (val !== this._visible) {
            this._visible = val;

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {visible: this._visible}};
                this._onChangeListener.materialUpdate(update)
            }
        }
    }

    set program(val) {
        if (val !== this._program) {
            this._program = val;

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {program: this._program}};
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
    get visible() { return this._visible; }
    get program() { return this._program; }

    toJson() {
        var obj = {};

        obj._uuid = this._uuid;
        obj.type = this.type;

        obj.name = this._name;
        obj.side = this._side;

        obj.depthFunc = this._depthFunc;
        obj.depthTest = this._depthTest;
        obj.depthWrite = this._depthWrite;

        obj.transparent = this._transparent;
        obj.opacity = this._opacity;

        obj.visible = this._visible;

        obj.program = this._program;

        return obj;
    }

    static fromJson(obj, material) {
        if (!material) {
            var material = new M3D.Material();
        }

        material._uuid = obj._uuid;

        material._name = obj.name;
        material._side = obj.side;

        material._depthFunc = obj.depthFunc;
        material._depthTest = obj.depthTest;
        material._depthWrite = obj.depthWrite;

        material._transparent = obj.transparent;
        material._opacity = obj.opacity;

        material._visible = obj.visible;

        material._program = obj.program;

        return material;
    }

    update(data) {
        for (var prop in data) {
            switch (prop) {
                case "visible":
                    this._visible = data.visible;
                    delete data.visible;
                    break;
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
                case "name":
                    this._name = data.name;
                    delete data.name;
                    break;
                case "program":
                    this._program = data.program;
                    delete data.program;
                    break;

            }
        }
    }
};