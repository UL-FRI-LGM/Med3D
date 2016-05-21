
M3D.MeshPhongMaterial = function (parameters) {

    M3D.Material.call(this);

    this.type = 'MeshPhongMaterial';

    // Diffuse
    this.color = new THREE.Color( 0xffffff );
    this.specular = new THREE.Color( 0x111111 );
    this.shininess = 32;

    this.program = "phong";
};

M3D.MeshPhongMaterial.prototype = Object.create( M3D.Material.prototype );
M3D.MeshPhongMaterial.prototype.constructor = M3D.MeshPhongMaterial;