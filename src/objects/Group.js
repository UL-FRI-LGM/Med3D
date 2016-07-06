/**
 * Created by Primoz on 29.6.2016.
 */

M3D.Group = class extends M3D.Object3D {
    constructor () {
        super(M3D.Object3D);

        this.type = "Group";
    }

    static fromJson(data) {

        var group = new M3D.Group();

        // Object3D fromJson
        group = super.fromJson(data, group);

        return group;
    }
};
