/**
 * Created by Primoz on 8.6.2016.
 */

M3D.MHDReader = class {

    /**
     * Instantiates MHD reader with the loading callback
     * @param onLoad {function} Callback used by the loading functions.
     */
    constructor(onLoad) {
        // Loading callback
        this._onLoad = onLoad;

        // Object that holds relevant MHD meta data
        this._mhdMeta = {};

        // MHD and RAW file names
        this._mhdFile = "";
        this._rawFile = "";

        // Any non-critical data miss-matches will be logged here
        this._warnings = [];

        this._fileReader = new FileReader();
        this._loadingInProgress = false;
    }

    /**
     * Asynchronously loads the volume values and meta data from the specified HTML5 files. Data is returned via object
     * global onLoad callback specified in the constructor. Besides the values and meta data the callback also contains
     * warning and error messages produced during the loading.
     *
     * @param mhdFile {Blob} HTML5 file pointing at .mhd file containing volume meta data like dimensions, orientation, position and data format.
     * @param rawFile {Blob} HTML5 file pointing at .raw file containing volume values
     * @returns {boolean} True if the loading was starter. False if the loading could not be started because there is already loading in progress.
     */
    fileLoad (mhdFile, rawFile) {
        // Check if anything is beeing loaded
        if (this._loadingInProgress) {
            return false;
        }

        // Put up the loading flag
        this._loadingInProgress = true;

        // Save reference to files
        this._mhdFile = mhdFile;
        this._rawFile = rawFile;
        var self = this;

        var rawParser = function(event) {
            var rez = {};
            var data;
            try {

                var dataLength = self._mhdMeta.dimensions[0] * self._mhdMeta.dimensions[1] * self._mhdMeta.dimensions[2];
                var requiredByteLength = 0;

                // Build the correct typed array based on the volume element type
                switch (self._mhdMeta.elementType) {
                    case "MET_CHAR":
                        data = new Int8Array(this.result);
                        requiredByteLength = dataLength;
                        break;
                    case "MET_UCHAR":
                        data = new Uint8Array(this.result);
                        requiredByteLength = dataLength;
                        break;
                    case "MET_SHORT":
                        data = new Int16Array(this.result);
                        requiredByteLength = dataLength * 2;
                        break;
                    case "MET_USHORT":
                        data = new Uint16Array(this.result);
                        requiredByteLength = dataLength * 2;
                        break;
                    case "MET_INT":
                        data = new Int32Array(this.result);
                        requiredByteLength = dataLength * 4;
                        break;
                    case "MET_UINT":
                        data = new Uint32Array(this.result);
                        requiredByteLength = dataLength * 4;
                        break;
                    case "MET_DOUBLE":
                        data = new Float64Array(this.result);
                        requiredByteLength = dataLength * 8;
                        break;
                }

                if (this.result.byteLength !== requiredByteLength) {
                    self._warnings.push("WARNING: Invalid data byte count.");
                }
                rez = {meta: self._mhdMeta, data: data, errorMsg: "", warnings: self._warnings};
            }
            catch (err) {
                rez = {errorMsg: "ERROR: Could not correctly parse the RAW file!", warnings: self._warnings};
            }

            // Return the result and toggle the loading flag.
            self._onLoad(rez);
        };


        var mhdParser = function(event) {
            var errorMsg = "";
            try {
                var mhdData = this.result;

                // Parse MHD content
                var nDims = parseInt(/NDims\s+=\s+(.*)[\r\n]/g.exec(mhdData)[1]);
                self._mhdMeta.dimensions = /DimSize\s+=\s+(.*)[\r\n]/g.exec(mhdData)[1].match(/\S+/g).map(Number);
                self._mhdMeta.elementSpacing = /ElementSpacing\s+=\s+(.*)[\r\n]/g.exec(mhdData)[1].match(/\S+/g).map(Number);
                self._mhdMeta.position = /Position\s+=\s+(.*)[\r\n]/g.exec(mhdData)[1].match(/\S+/g).map(Number);
                self._mhdMeta.byteOrderMsb = /ElementByteOrderMSB\s+=\s+(.*)[\r\n]/g.exec(mhdData)[1].replace(/\s+/g, '').toLowerCase() === "false";
                self._mhdMeta.elementType = /ElementType\s+=\s+(.*)[\r\n]/g.exec(mhdData)[1];
                var dataFileName = /ElementDataFile\s+=\s+(.*)[\r\n]/g.exec(mhdData)[1];

                // Check if the file RAW name matches the one specified in the MHD file
                if (self._rawFile.name !== dataFileName) {
                    self._warnings.push("RAW name does not match the one specified in the MHD file.")
                }
                // Check if this is indeed 3 dimensional data
                if (nDims !== 3) {
                    errorMsg = "Invalid data dimensions (" + nDims + ")";
                }

            } catch (err) {
                errorMsg = "ERROR: Could not correctly parse the MHD file!";
            }

            // Check if there has been an error while parsing the meta data
            if (errorMsg !== "") {
                self._onLoad({error: errorMsg});
                self._loadingInProgress = false;

                return;
            }

            // If everything is in order.. proceed to RAW file loading
            this.onload = rawParser;
            this.readAsArrayBuffer(self._rawFile);
        };

        // Initiate MHD file loading
        this._fileReader.onload = mhdParser;
        this._fileReader.readAsBinaryString(this._mhdFile);

        return true;
    }

};