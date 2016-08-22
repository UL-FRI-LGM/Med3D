/**
 * Created by Primoz on 27. 03. 2016.
 */

M3D.Scene = class extends M3D.Object3D {

    constructor() {
        super(M3D.Object3D);

        this.type = "Scene";

        this._autoUpdate = true; // checked by the renderer
    }

    get autoUpdate() { return this._autoUpdate; }
    set autoUpdate(val) {
        if (val !== this._autoUpdate) {
            this._autoUpdate = val;

            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {autoUpdate: this._autoUpdate}};
                this._onChangeListener.objectUpdate(update)
            }
        }
    }

    toJson() {
        var obj = super.toJson();

        // Export auto update setting
        obj.autoUpdate = this._autoUpdate;

        return obj;
    }

    static fromJson(data) {
        var scene = new M3D.Scene();

        // Import Object3D parameters
        scene = super.fromJson(data, scene);

        // Import auto update setting
        scene._autoUpdate = data.autoUpdate;

        return scene;
    }
    
    update(data) {
        super.update(data);

        for (var prop in data) {
            switch (prop) {
                case "autoUpdate":
                    this._autoUpdate = data.autoUpdate;
            }
        }
    }
};
