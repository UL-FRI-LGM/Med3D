/**
 * Created by Primoz on 4.4.2016.
 */

M3D.MeshBasicMaterial = function () {

    M3D.Material.call( this );

    this.type = 'MeshBasicMaterial';

    this.color = new THREE.Color( 0x33bb33 ); // emissive

    this.shading = M3D.SmoothShading;

    this.program = "basic";
};

M3D.MeshBasicMaterial.prototype = Object.create( M3D.Material.prototype );
M3D.MeshBasicMaterial.prototype.constructor = M3D.MeshBasicMaterial;