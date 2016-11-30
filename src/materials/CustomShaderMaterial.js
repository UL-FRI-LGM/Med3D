/**
 * Created by Primoz on 8. 11. 2016.
 */

M3D.CustomShaderMaterial = class extends M3D.Material {

    constructor(programName, uniforms = {}, attributes = {}) {
        super(M3D.Material);

        this.type = "CustomShaderMaterial";

        /**
         * Javascript maps of custom uniforms and attributes where the key represents attribute/uniform name and value
         * represents values (values must be presented in the correct format).
         */
        this._uniforms = uniforms;
        this._attributes = attributes;

        // ShaderBuilder flags, values
        this._flagsSB = [];
        this._valuesSB = {};

        // Is affected by lights
        this._lights = true;

        // Textures
        this._maps = [];

        // PAY ATTENTION TO THIS - Custom programs have prefix custom in order to avoid collisions with other programs
        this._programName = "custom_" + programName;
        this._requiredProgramTemplate = null;
    }

    addSBFlag(flag) {
        this._flagsSB.push(flag);
    }

    rmSBFlag(flag) {
        this._flagsSB.remove(flag);
    }

    clearSBFlags() {
        this._flagsSB.clear();
    }

    addSBValue(name, value) {
        this._valuesSB[name] = value;
    }

    rmSBFlag(flag) {
        delete this._valuesSB[name];
    }

    clearSBFlags() {
        this._valuesSB = {};
    }

    // region MAP MANAGEMENT
    addMap(map) {
        // Invalidate required program template
        this._requiredProgramTemplate = null;

        this._maps.push(map)
    }


    removeMap(map) {
        let index = this._maps.indexOf(map);

        if (index > -1) {
            // Invalidate required program template
            this._requiredProgramTemplate = null;

            this._maps.splice(index, 1);
        }
    }

    clearMaps() {
        // Invalidate required program template
        this._requiredProgramTemplate = null;

        this._maps = [];
    }
    // endregion

    // region UNIFORM/ATTRIBUTE MANAGEMENT
    setUniform(name, value) {
        this._uniforms[name] = value;
    }

    removeUniform(name) {
        delete this._uniforms[name];
    }

    setAttribute(name, value) {
        this._attributes[name] = value;
    }

    removeAttribute(name) {
        delete this._attributes[name];
    }
    // endregion

    requiredProgram() {
        // If the template is already generate use it
        if (this._requiredProgramTemplate !== null) {
            return this._requiredProgramTemplate;
        }

        // Create program specification
        let flags = [];
        let values = {};

        // Add user defined flags
        for (let i = 0; i < this._flagsSB.length; i++) {
            flags.push(this._flagsSB[i]);
        }

        // Add user defined values
        for (let name in this._valuesSB) {
            if (this._valuesSB.hasOwnProperty(name)) {
                values[name] = this._valuesSB[name];
            }
        }

        // Add lights and map related values and flags
        if (this._lights) {
            flags.push("LIGHTS");
        }

        if (this._maps.length > 0) {
            flags.push("TEXTURE");
            // Specify number of used textures
            values["NUM_TEX"] = this._maps.length;
        }


        return new M3D.MaterialProgramTemplate(this._programName, flags, values);
    }

    set lights(val) {
        if (this._lights !== val) {
            // Invalidate required program template
            this._requiredProgramTemplate = null;

            this._lights = val;
        }
    }
    get lights() { return this._lights; }
    get maps() { return this._maps; }

    set programName(val) { this._programName = val };
    get programName() { return this._programName };
};