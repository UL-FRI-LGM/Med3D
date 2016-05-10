// TODO - Primoz: poglej če res to rabimo, drugeče delete

/**
 * Created by Primoz on 3.4.2016.
 */

/**
 * Singleton used to globally store and map WebGL related properties (WebGL Buffers, Uniforms,..). Properties
 * added should be mapped with a globally unique identifier, for example identifier generated with THREE.Math.generateUUID()
 * @constructor Creates WebGLProperties
 */
M3D.GLProperties = class {

    /**
     * Initializes empty property dictionary
     */
    constructor () {
        this.properties = {};
    }

    /**
     * Fetches global WebGL properties of the given object
     * @param object An object whose properties should be retrieved
     * @returns {map} Objects WebGL properties
     */
    getProperties (object) {
        // Get object's unique identifier
        var uuid = object.uuid;

        // Check if properties entry exists for this object
        var map = this.properties[ uuid ];

        // If properties for this object do not exist, form new empty properties entry
        if ( map === undefined ) {
            map = {};
            this.properties[uuid] = map;
        }

        return map;
    }

    /**
     * Deletes global WebGL properties of the given object
     * @param object An object whose properties should be deleted
     */
    deleteProperties (object) {
        delete this.properties[ object.uuid ];
    }

    /**
     * Clears all properties
     */
    clear () {
        this.properties = {};
    }
};
