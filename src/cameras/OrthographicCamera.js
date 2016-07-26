/**
 * Created by Primoz on 23. 07. 2016.
 */

M3D.OrthographicCamera = class extends M3D.Camera {
    constructor(left, right, top, bottom, near, far) {
        super(M3D.Camera);

        this.type = "PerspectiveCamera";

        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;

        this.near = ( near !== undefined ) ? near : 0.1;
        this.far = ( far !== undefined ) ? far : 2000;

        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        var dx = (this.right - this.left) / 2;
        var dy = (this.top - this.bottom) / 2;
        var cx = (this.right + this.left) / 2;
        var cy = (this.top + this.bottom) / 2;

        var left = cx - dx;
        var right = cx + dx;
        var top = cy + dy;
        var bottom = cy - dy;

        this.projectionMatrix.makeOrthographic(left, right, top, bottom, this.near, this.far);
    }
};