/**
 * Created by Primoz on 24. 11. 2016.
 */

M3D.MaterialProgramTemplate = class {

    constructor(name, flags, values) {
        this.name = name;
        this.flags = flags;
        this.values = values;

        this.programID = this._generateProgramID();
    }

    /**
     * Generates unique program name for the set of input parameters
     */
    _generateProgramID() {
        // Sort the flags to get the correct order
        var sortedFlags = this.flags.sort();

        // Generate sorted list of values names
        var sortedValuesNames = Object.keys(this.values).sort();

        var programName = this.name;

        // First concat the shader flags
        for (var i = 0; i < sortedFlags.length; i++) {
            programName += sortedFlags[i];
        }

        // Append the merged value names and values
        for (var i = 0; i < sortedValuesNames.length; i++) {
            programName += sortedValuesNames[i] + this.values[sortedValuesNames[i]];
        }

        return programName;
    }

    /**
     * Equality comparisons of two material program templates
     */
    compare(program) {
        return this.programID === program.programID;
    }
};