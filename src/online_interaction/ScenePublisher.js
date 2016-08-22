/**
 * Created by Primoz on 18. 06. 2016.
 */

M3D.ScenePublisher = class {
    
    constructor(rootObjects, cameras, onConnectionChange) {

        var self = this;

        this._rootObjects = rootObjects;
        this._cameras = cameras;
        this._updateInProgress = false;

        // Scheduled updates
        this._scheduledCameraUpdates = {};
        this._scheduledObjectsUpdates = {};
        this._scheduledMaterialsUpdates = {};
        this._scheduledGeometriesUpdates = {};

        this._newCameras = {};
        this._newObjects = {objects: {}, geometries: {}, materials: {}};
        this._synchronizedObjects = new Map();

        //TODO: Set update interval based on the server/publisher latency
        this._updateInterval = 8;
        this._lastUpdate = null;
        this._dirty = false;

        var onCameraUpdate = function(update) {
            self._dirty = true;
            // Update previous update entry
            var changes = update.changes;

            var entry = self._scheduledCameraUpdates[update.uuid];

            if (entry !== undefined) {
                for (var prop in changes) {
                    entry[prop] = changes[prop];
                }
            }
            else {
                // Add new update entry
                self._scheduledCameraUpdates[update.uuid] = update.changes;
            }
        };

        var onObjectUpdate = function(update) {
            self._dirty = true;
            // Update previous update entry
            var changes = update.changes;

            var entry = self._scheduledObjectsUpdates[update.uuid];

            if (entry !== undefined) {
                for (var prop in changes) {
                    entry[prop] = changes[prop];
                }
            }
            else {
                // Add new update entry
                self._scheduledObjectsUpdates[update.uuid] = update.changes;
            }
        };

        var onHierarchyUpdate = function(update) {
            self._dirty = true;

            var changes = update.changes;
            var object = changes.objectRef;

            if (self._synchronizedObjects.has(update.uuid)) {
                // Schedule parent change update
                var scheduledUpdate = self._scheduledObjectsUpdates[update.uuid];

                // Swap parent
                if (scheduledUpdate) {
                    scheduledUpdate.parentUuid = changes.parentUuid;
                } else {
                    self._scheduledObjectsUpdates[update.uuid] = { parentUuid: changes.parentUuid }
                }

                // If parent uuid is null add objectRef to delete all hierarchy
                if (changes.parentUuid === null) {
                    self._scheduledObjectsUpdates[update.uuid].objectRef = changes.objectRef;
                }
                else {
                    delete self._scheduledObjectsUpdates[update.uuid].objectRef;
                }
            } else {
                // New object not previously seen was added to the hierarchy
                self._newObjects.objects[object._uuid] = object.toJson();
                self._synchronizedObjects.set(object._uuid, object);

                // Start listening for changes on this object
                object.addOnChangeListener(this, false);

                // If the object is mesh also synchronize material and geometry
                if (object.type === "Mesh") {
                    var syncGeometry = self._synchronizedObjects.get(object.geometry._uuid);
                    if (syncGeometry === undefined) {
                        self._newObjects.geometries[object.geometry._uuid] = object.geometry.toJson();
                        self._synchronizedObjects.set(object.geometry._uuid, {usages: 1});
                    }
                    else {
                        syncGeometry.usages ++;
                    }

                    var syncMaterial = self._synchronizedObjects.get(object.material._uuid);
                    if (syncMaterial === undefined) {
                        self._newObjects.materials[object.material._uuid] = object.material.toJson();
                        self._synchronizedObjects.set(object.material._uuid, {usages: 1});
                    }
                    else {
                        syncMaterial.usages ++;
                    }
                }

                // Add whole hierarchy
                for (var i = 0; i < object.children.length; i++) {
                    onHierarchyUpdate({uuid: object.children[i]._uuid, changes: {parentUuid: object._uuid, objectRef: object.children[i]}})
                }
            }
        };

        var onMaterialUpdate = function(update) {
            self._dirty = true;

            var entry = self._scheduledMaterialsUpdates[update.uuid];

            if (entry !== undefined) {
                // Update previous update entry
                var changes = update.changes;

                for (var prop in changes) {
                    entry[prop] = changes[prop];
                }
            }
            else {
                // Add new update entry
                self._scheduledMaterialsUpdates[update.uuid] = update.changes;
            }
        };

        var onGeometryUpdate = function(update) {
            self._dirty = true;

            var entry = self._scheduledGeometriesUpdates[update.uuid];

            if (entry !== undefined) {
                // Update previous update entry
                var changes = update.changes;

                for (var prop in changes) {
                    entry[prop] = changes[prop];
                }
            }
            else {
                // Add new update entry
                self._scheduledGeometriesUpdates[update.uuid] = update.changes;
            }
        };

        this._cameraChangeListener = new M3D.UpdateListener(onCameraUpdate);
        this._dataChangeListener = new M3D.UpdateListener(onObjectUpdate, onHierarchyUpdate, onMaterialUpdate, onGeometryUpdate);

        this._onConnectionChange = onConnectionChange;
        this._socket = null;
    }

    startPublishing(updateInterval) {
        if (updateInterval) {
            this._updateInterval = updateInterval;
        }
        this._lastUpdate = new Date();

        let self = this;

        // Init socket
        this._socket = io();

        // Notify subscriber on connect and upload the scene to the server.
        this._socket.on('connect', function() {
            self._updateInProgress = true;

            var serverCallback = function() {
                self._updateInProgress = false;
                self._onConnectionChange({status: 0, session_uuid: self._socket.id});
            };

            // After finishing the data upload. Share cameras.
            self._uploadData(function () {
                self._uploadCameras(self._cameras, serverCallback)
            });
        });
    }

    stopPublishing() {
        this._socket.disconnect();

        // Destroy scene changes listener
        this._dataChangeListener = null;

        // Clear any cached data
        this._scheduledObjectsUpdates = {};
        this._scheduledMaterialsUpdates = {};
        this._scheduledGeometriesUpdates = {};

        this._newObjects = {objects: {}, geometries: {}, materials: {}};
        this._synchronizedObjects.clear();
    }

    // Uploads the shared objects to the server
    _uploadData(callback) {
        var data = {objects: {}, geometries: {}, materials: {}};

        // Export all root objects and their hierarchies to Json and add update listener
        for (var i = 0; i < this._rootObjects.length; i++) {
            this._rootObjects[i].exportHierarchy(data);
            this._rootObjects[i].addOnChangeListener(this._dataChangeListener, true);
        }

        // Mark data as synchronized
        for (var uuid in data.objects) {
            this._synchronizedObjects.set(uuid, {});
        }
        for (var uuid in data.geometries) {
            var syncGeometry = this._synchronizedObjects.get(uuid);
            if (syncGeometry === undefined) {
                this._synchronizedObjects.set(uuid, {usages: 1});
            }
            else {
                syncGeometry.usages ++;
            }
        }
        for (var uuid in data.materials) {
            var syncMaterial = this._synchronizedObjects.get(uuid);
            if (syncMaterial === undefined) {
                this._synchronizedObjects.set(uuid, {usages: 1});
            }
            else {
                syncMaterial.usages ++;
            }
        }

        // Form the request and forward it to server via socket.io
        var request = {type: "create", data: data};

        this._socket.emit("session", request, callback);
    }

    // Uploads new cameras to the server
    _uploadCameras(cameras, callback) {
        // Export the cameras
        var camerasJson = {};
        for (var i = 0; i < cameras.length; i++) {
            camerasJson[cameras[i]._uuid] = cameras[i].toJson();
            cameras[i].addOnChangeListener(this._cameraChangeListener, false);
        }

        var request = {type: "add", sessionId: this._socket.io.engine.id, cameras: camerasJson};

        this._socket.emit("sessionCameras", request, callback);
    }

    _updateData(callback) {
        var self = this;
        var updateData = {updates: {}, newObjects: {}};
        var updateEmpty = true;

        // Add object updates
        if (Object.keys(this._scheduledObjectsUpdates).length > 0) {

            // Remove deleted objects from the synchronized objects group
            for (var uuid in this._scheduledObjectsUpdates) {
                if (this._scheduledObjectsUpdates[uuid].parentUuid === null) {

                    // Remove the object and all of its children
                    this._scheduledObjectsUpdates[uuid].objectRef.traverse(function (child) {
                        self._synchronizedObjects.delete(child._uuid);

                        // If the object is instance of mesh also delete its material or geometry
                        if (child instanceof M3D.Mesh) {
                            var syncGeometry = self._synchronizedObjects.get(child.geometry._uuid);
                            if (--syncGeometry.usages <= 0) {
                                self._scheduledGeometriesUpdates[child.geometry._uuid] = { remove: true };
                                self._synchronizedObjects.delete(child.geometry._uuid);
                            }

                            var syncMaterial = self._synchronizedObjects.get(child.material._uuid);
                            if (--syncMaterial.usages <= 0) {
                                self._scheduledMaterialsUpdates[child.material._uuid] = { remove: true };
                                self._synchronizedObjects.delete(child.material._uuid);
                            }
                        }

                        // Schedule deletion update
                        self._scheduledObjectsUpdates[child._uuid] = { remove: true }
                    });
                }
            }

            // Schedule update
            updateData.updates.objects = this._scheduledObjectsUpdates;
            updateEmpty = false;
        }

        if (Object.keys(this._scheduledMaterialsUpdates).length > 0) {
            updateData.updates.materials = this._scheduledMaterialsUpdates;
            updateEmpty = false;
        }

        if (Object.keys(this._scheduledGeometriesUpdates).length > 0) {
            updateData.updates.geometries = this._scheduledGeometriesUpdates;
            updateEmpty = false;
        }

        // Add newly added objects
        if (Object.keys(this._newObjects.objects).length > 0) {
            updateData.newObjects.objects = this._newObjects.objects;
            updateEmpty = false;
        }

        if (Object.keys(this._newObjects.geometries).length > 0) {
            updateData.newObjects.geometries = this._newObjects.geometries;
            updateEmpty = false;
        }

        if (Object.keys(this._newObjects.materials).length > 0) {
            updateData.newObjects.materials = this._newObjects.materials;
            updateEmpty = false;
        }

        // If there is nothing to update.. fallback
        if (updateEmpty) {
            callback();
            return;
        }

        // Forward the request to the server
        this._socket.emit("sessionDataUpdate", updateData, callback);

        // Reset scheduled updates
        this._scheduledObjectsUpdates = {};
        this._scheduledMaterialsUpdates = {};
        this._scheduledGeometriesUpdates = {};

        this._newObjects = {objects: {}, geometries: {}, materials: {}};
        this._dirty = false;
    }

    _updateCameras(callback) {
        if (Object.keys(this._scheduledCameraUpdates).length > 0 || Object.keys(this._newCameras).length > 0) {
            var request = {type: "update", sessionId: this._socket.io.engine.id, newCameras: this._newCameras, updates: this._scheduledCameraUpdates};

            this._newCameras = {};
            this._scheduledCameraUpdates = {};

            this._socket.emit("sessionCameras", request, callback);
        }
        else {
            callback();
        }
    }

    miscRequestEmit(namespace, request, callback) {
        if (this._socket !== null) {
            this._socket.emit(namespace, request, callback);
        }
        else {
            callback({status: 1, msg: "Socket is closed."});
        }
    }

    setMiscListener(namespace, callback) {
        if (this._socket !== null) {
            this._socket.on(namespace, callback);
            return true;
        }
        else {
            return false;
        }
    }

    rmMiscListener(namespace) {
        if (this._socket !== null) {
            this._socket.removeAllListeners(namespace);
        }
    }

    getSocketID() {
        if (this._socket !== null) {
            return this._socket.id;
        }
        else {
            return null;
        }
    }

    getSessionID() {
        if (this._socket !== null) {
            return this._socket.io.engine.id;
        }
        else {
            return null;
        }
    }

    addCameras(...cameras) {
        for (var i = 0; i < cameras.length; i++) {
            this._newCameras[cameras[i]._uuid] = cameras[i].toJson();
            cameras[i].addOnChangeListener(this._cameraChangeListener, false);
        }
    }

    update() {
        var currentTime = new Date();

        if (!this._dirty || currentTime - this._lastUpdate < this._updateInterval || this._updateInProgress) {
            return;
        }

        this._lastUpdate = currentTime;
        this._updateInProgress = true;

        var self = this;

        // Implement timeout mechanism
        this._updateCameras(function () {
            self._updateData(function() {
                self._updateInProgress = false;
            });
        });
    }
};