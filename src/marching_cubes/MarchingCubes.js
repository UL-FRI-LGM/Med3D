/**
 * Created by Primoz on 31.5.2016.
 */

M3D.MarchingCubes = class {

    constructor () {
        this._jobQueue = [];
        this._isRunning = false;
    }

    extractMesh (meta, values, nThreads, callback) {
        this._jobQueue.push({meta, values, nThreads, callback});

        if (!this._isRunning) {
            this._executeNextJob();
        }
    }

    _executeNextJob() {
        this._isRunning = true;
        var self = this;

        // Split the work among workers
        var meta = this._jobQueue[0].meta;
        var nThreads = this._jobQueue[0].nThreads;

        var worker;

        // TODO: Find out optimal value
        if (true || meta.dimensions.x * meta.dimensions.y * meta.dimensions.z < 10000 || nThreads <= 1 || meta.dimensions.z < nThreads) {
            worker = new Worker("../src/marching_cubes/MarchingCubesWorker.js");

            // When single worker is used.. When the result message comes.. immediately execute the callback and move to the next task
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

            // Start the worker task
            worker.postMessage([this._jobQueue[0].meta, this._jobQueue[0].values]);
        }
        else {
            // Calculate segment sizes (work distribution)
            var remainder = meta.dimensions.z % nThreads;
            var segment = Math.trunc(meta.dimensions.z / nThreads);

            // Array for combined results finish counters
            var combinedResult = [];
            var counter = 0;

            var offset = 0;

            for (var i = 0; i < nThreads; i++) {
                // Correctly distribute the remainder
                var size = (remainder-- > 0) ? segment + 1 : segment;
                // Padding needs to be added to correctly close the gaps between segments
                var paddedSize = (i !== nThreads - 1) ? size + 1 : size;
                var chunkSize = paddedSize * meta.dimensions.x * meta.dimensions.y;


                // Split the data
                //var positionsSegment = this._jobQueue[0].positions.slice(offset * 3, (offset + chunkSize) * 3);
                var valuesSegment = this._jobQueue[0].values.slice(offset, offset + chunkSize);

                offset += size * meta.dimensions.x * meta.dimensions.y;

                // Initialize and start workers

                worker = new Worker("../src/marching_cubes/MarchingCubesWorker.js");


                var start = new Date();
                worker.onmessage = function (result) {
                    var end = new Date();
                    console.log("Worker processing time: " + (end - start)/1000);

                    // Increment the finished counter
                    counter ++;
                    combinedResult = combinedResult.concat(result.data);

                    // When the last worker finishes.. return the combined result via callback
                    if (counter === nThreads) {
                        // Notify user about the results
                        self._jobQueue[0].callback(combinedResult);
                        self._jobQueue.shift();


                        // Check if there is anything left in the queue
                        if (self._jobQueue.length !== 0) {
                            self._executeNextJob();
                        }
                        else {
                            self._isRunning = false;
                        }
                    }
                };

                worker.postMessage([{dimensions: {x: meta.dimensions.x, y: meta.dimensions.y, z: paddedSize}, axisMin: meta.axisMin, axisMax: meta.axisMax }, valuesSegment]);
            }

        }
    }
};