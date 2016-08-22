/**
 * Created by Primoz on 23. 07. 2016.
 */

M3D.OrthographicCamera = class extends M3D.Camera {
    constructor(left, right, top, bottom, near, far) {
        super(M3D.Camera);

        this.type = "OrthographicCamera";

        this._left = left;
        this._right = right;
        this._top = top;
        this._bottom = bottom;

        this._near = ( near !== undefined ) ? near : 0.1;
        this._far = ( far !== undefined ) ? far : 2000;

        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        var dx = (this._right - this._left) / 2;
        var dy = (this._top - this._bottom) / 2;
        var cx = (this._right + this._left) / 2;
        var cy = (this._top + this._bottom) / 2;

        var left = cx - dx;
        var right = cx + dx;
        var top = cy + dy;
        var bottom = cy - dy;

        this.projectionMatrix.makeOrthographic(left, right, top, bottom, this._near, this._far);
    }

    toJson() {
        // Export Object3D parameters
        var obj = super.toJson();

        // Export orthographic camera parameters
        obj.left = this._left;
        obj.right = this._right;
        obj.top = this._top;
        obj.bottom = this._bottom;

        obj.near = this._near;
        obj.far = this._far;

        return obj;
    }

    static fromJson(data) {
        // Create new object with the given camera parameters
        var camera = new M3D.OrthographicCamera(data.left, data.right, data.top, data.bottom, data.near, data.far);

        // Import underlying Object3D parameters
        return super.fromJson(data, camera);
    }

    update(data) {
        super.update(data);

        // Check if there are any camera parameter updates
        var modified = false;
        for (var prop in data) {
            switch (prop) {
                case "fov":
                    this._fov = data.fov;
                    delete data.fov;
                    modified = true;
                    break;
                case "near":
                    this._near = data.near;
                    delete data.near;
                    modified = true;
                    break;
                case "far":
                    this._far = data.far;
                    delete data.far;
                    modified = true;
                    break;
            }
        }

        // If the camera parameters have been modified update the projection matrix
        if (modified) {
            this.updateProjectionMatrix();
        }
    }
};