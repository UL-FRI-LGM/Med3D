/**
 * Created by Primoz Lavric on 06-Mar-17.
 */

// Compatible with THREE.js math functions
M3D.Spherical = class {

    constructor(radius, phi, theta) {
        this.radius = ( radius !== undefined ) ? radius : 1.0;
        this.phi = ( phi !== undefined ) ? phi : 0; // up / down towards top and bottom pole
        this.theta = ( theta !== undefined ) ? theta : 0; // around the equator of the sphere
    }

    set(radius, phi, theta) {
        this.radius = radius;
        this.phi = phi;
        this.theta = theta;

        return this;
    }

    clone() {
        return new this.constructor().copy( this );
    }

    copy(other) {
        this.radius = other.radius;
        this.phi = other.phi;
        this.theta = other.theta;

        return this;
    }

    // restrict phi to be between EPS and PI-EPS
    makeSafe() {
        let EPS = 0.000001;
        this.phi = Math.max( EPS, Math.min( Math.PI - EPS, this.phi ) );

        return this;
    }

    setFromVector3(vec3) {
        this.radius = vec3.length();

        if (this.radius === 0) {
            this.theta = 0;
            this.phi = 0;
        }
        else {
            this.theta = Math.atan2(vec3.x, vec3.z); // equator angle around y-up axis
            this.phi = Math.acos(Math.min(Math.max(vec3.y / this.radius, -1), 1)); // polar angle
        }

        return this;
    }
};