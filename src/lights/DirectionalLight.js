/**
 * Created by Primoz on 18.5.2016.
 */

M3D.DirectionalLight = class extends M3D.Light {

    constructor(color, intensity) {
        super(color, intensity);

        // Direction
        this.position.set( 0, 1, 0 );

        this.updateMatrix();
    }
};