/**
 * Created by Primoz on 27. 03. 2016.
 */


// TODO - Primoz: v ES6
M3D.Scene = function () {
    M3D.Object3D.call( this );

    this.type = 'Scene';

    this.overrideMaterial = null;

    this.autoUpdate = true; // checked by the rendererw
};

M3D.Scene.prototype = Object.create( M3D.Object3D.prototype );
M3D.Scene.prototype.constructor = M3D.Scene;