/**
 * Created by Primoz on 31.5.2016.
 */

M3D.MarchingCubes = class {

    constructor () {
        this._jobQueue = [];
        this._isRunning = false;
    }

    extractMesh (dimensions, positions, values, callback) {
        this._jobQueue.push({dimensions, positions, values, callback});

        if (!this._isRunning) {
            this._executeNextJob();
        }
    }

    _executeNextJob() {
        this._isRunning = true;
        var self = this;

        var worker = new Worker("../src/marching_cubes/MarchingCubesWorker.js");

        worker.onmessage = function (result) {
            // Notify user about the results
            self._jobQueue[0].callback(result.data);
            self._jobQueue.shift();

            // Check if there is anything left in the queue
            if (self._jobQueue.length !== 0) {
                self._executeNextJob();
            }
            else {
                self._isRunning = false;
            }
        };

        worker.postMessage([this._jobQueue[0].dimensions, this._jobQueue[0].positions, this._jobQueue[0].values])
    }
};