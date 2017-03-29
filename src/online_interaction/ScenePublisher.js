/**
 * Created by Primoz on 18. 06. 2016.
 */

M3D.ScenePublisher = class {
    
    constructor(username, rootObjects, onConnectionChange) {

        let self = this;

        this._username = username;

        this._rootObjects = rootObjects;
        this._updateInProgress = false;

        // Scheduled updates
        this._scheduledCameraUpdates = {};
        this._scheduledObjectsUpdates = {};
        this._scheduledMaterialsUpdates = {};
        this._scheduledGeometriesUpdates = {};

        this._newObjects = {objects: {}, geometries: {}, materials: {}};
        this._synchronizedObjects = new Map();

        //TODO: Set update interval based on the server/publisher latency
        this._updateInterval = 8;
        this._lastUpdate = null;
        this._dirty = false;

        let onCameraUpdate = function(update) {
            self._dirty = true;
            // Update previous update entry
            let changes = update.changes;

            let entry = self._scheduledCameraUpdates[update.uuid];

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

        let onObjectUpdate = function(update) {
            self._dirty = true;
            // Update previous update entry
            let changes = update.changes;

            let entry = self._scheduledObjectsUpdates[update.uuid];

            if (entry !== undefined) {
                for (let prop in changes) {
                    entry[prop] = changes[prop];
                }
            }
            else {
                // Add new update entry
                self._scheduledObjectsUpdates[update.uuid] = update.changes;
            }
        };

        let onHierarchyUpdate = function(update) {
            self._dirty = true;

            let changes = update.changes;
            let object = changes.objectRef;

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
                    let syncGeometry = self._synchronizedObjects.get(object.geometry._uuid);
                    if (syncGeometry === undefined) {
                        self._newObjects.geometries[object.geometry._uuid] = object.geometry.toJson();
                        self._synchronizedObjects.set(object.geometry._uuid, {usages: 1});
                    }
                    else {
                        syncGeometry.usages ++;
                    }

                    let syncMaterial = self._synchronizedObjects.get(object.material._uuid);
                    if (syncMaterial === undefined) {
                        self._newObjects.materials[object.material._uuid] = object.material.toJson();
                        self._synchronizedObjects.set(object.material._uuid, {usages: 1});
                    }
                    else {
                        syncMaterial.usages ++;
                    }
                }

                // Add whole hierarchy
                for (let i = 0; i < object.children.length; i++) {
                    onHierarchyUpdate({uuid: object.children[i]._uuid, changes: {parentUuid: object._uuid, objectRef: object.children[i]}})
                }
            }
        };

        let onMaterialUpdate = function(update) {
            self._dirty = true;

            let entry = self._scheduledMaterialsUpdates[update.uuid];

            if (entry !== undefined) {
                // Update previous update entry
                let changes = update.changes;

                for (let prop in changes) {
                    entry[prop] = changes[prop];
                }
            }
            else {
                // Add new update entry
                self._scheduledMaterialsUpdates[update.uuid] = update.changes;
            }
        };

        let onGeometryUpdate = function(update) {
            self._dirty = true;

            let entry = self._scheduledGeometriesUpdates[update.uuid];

            if (entry !== undefined) {
                // Update previous update entry
                let changes = update.changes;

                for (let prop in changes) {
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

        // Subscribers data
        this._subscribersCameras = {};
        this._subscriberOnCameraChange = null
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

            let serverCallback = function() {
                self._updateInProgress = false;
                self._onConnectionChange({status: 0, session_uuid: self._socket.id});
            };

            // After finishing the data upload. Share cameras.
            self._uploadData(function () {
                self._setupSubscriberCameraListener();
                serverCallback();
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

    // region SCENE DATA MANAGEMENT
    // Uploads the shared objects to the server
    _uploadData(callback) {
        let data = {objects: {}, geometries: {}, materials: {}};

        // Export all root objects and their hierarchies to Json and add update listener
        for (let i = 0; i < this._rootObjects.length; i++) {
            this._rootObjects[i].exportHierarchy(data);
            this._rootObjects[i].addOnChangeListener(this._dataChangeListener, true);
        }

        // Mark data as synchronized
        for (let uuid in data.objects) {
            this._synchronizedObjects.set(uuid, {});
        }
        for (let uuid in data.geometries) {
            let syncGeometry = this._synchronizedObjects.get(uuid);
            if (syncGeometry === undefined) {
                this._synchronizedObjects.set(uuid, {usages: 1});
            }
            else {
                syncGeometry.usages ++;
            }
        }
        for (let uuid in data.materials) {
            let syncMaterial = this._synchronizedObjects.get(uuid);
            if (syncMaterial === undefined) {
                this._synchronizedObjects.set(uuid, {usages: 1});
            }
            else {
                syncMaterial.usages ++;
            }
        }

        // Form the request and forward it to server via socket.io
        let request = {type: "create", username: this._username, data: data};

        this._socket.emit("session", request, callback);
    }

    _updateData(callback) {
        let self = this;
        let updateData = {updates: {}, newObjects: {}};
        let updateEmpty = true;

        // Add object updates
        if (Object.keys(this._scheduledObjectsUpdates).length > 0) {

            // Remove deleted objects from the synchronized objects group
            for (let uuid in this._scheduledObjectsUpdates) {
                if (this._scheduledObjectsUpdates[uuid].parentUuid === null) {

                    // Remove the object and all of its children
                    this._scheduledObjectsUpdates[uuid].objectRef.traverse(function (child) {
                        self._synchronizedObjects.delete(child._uuid);

                        // If the object is instance of mesh also delete its material or geometry
                        if (child instanceof M3D.Mesh) {
                            let syncGeometry = self._synchronizedObjects.get(child.geometry._uuid);
                            if (--syncGeometry.usages <= 0) {
                                self._scheduledGeometriesUpdates[child.geometry._uuid] = { remove: true };
                                self._synchronizedObjects.delete(child.geometry._uuid);
                            }

                            let syncMaterial = self._synchronizedObjects.get(child.material._uuid);
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
    // endregion SCENE DATA MANAGEMENT

    // region CAMERA HOSTING
    addCameras(cameras, callback) {
        let self = this;

        // Export the cameras
        let camerasJson = {};
        for (let i = 0; i < cameras.length; i++) {
            camerasJson[cameras[i]._uuid] = cameras[i].toJson();
        }

        // Forming request
        let request = {type: "add", sessionId: this._socket.io.engine.id, cameras: camerasJson};

        // When successfully uploaded add change listeners
        this._socket.emit("sessionCameras", request, function () {
            for (let i = 0; i < cameras.length; i++) {
                cameras[i].addOnChangeListener(self._cameraChangeListener, false);
            }

            if (callback) {
                callback();
            }
        });
    }

    _updateCameras(callback) {
        if (Object.keys(this._scheduledCameraUpdates).length > 0) {
            let request = {type: "update", sessionId: this._socket.io.engine.id, updates: this._scheduledCameraUpdates};
            request.timestamp = new Date().getTime();

            this._scheduledCameraUpdates = {};
            this._socket.emit("sessionCameras", request, callback);
        }
        else {
            callback();
        }
    }
    // endregion


    // region CAMERA LISTENING
    _setupSubscriberCameraListener() {
        let self = this;

        this._socket.on("sessionCameras", function (request) {
            if (request.type === "add") {
                let userCamerasList = request.data.list;

                // If user does not own the camera array create it
                if (self._subscribersCameras[request.userId] === undefined) {
                    self._subscribersCameras[request.userId] = {list: [], ownerUsername: request.data.ownerUsername};
                }

                // Create cameras
                for (let uuid in userCamerasList) {
                    let newCamera = M3D[userCamerasList[uuid].type].fromJson(userCamerasList[uuid]);
                    self._subscribersCameras[request.userId].list.push(newCamera);

                    // Notify subscriber
                    if (self._subscriberOnCameraChange !== null) {
                        self._subscriberOnCameraChange(self._subscribersCameras);
                    }
                }
            }
            else if (request.type === "update") {
                // Fetch user camera list
                let userCameras = self._subscribersCameras[request.userId];

                // Update cameras
                if (userCameras !== undefined) {
                    // Iterate through updates
                    for (let uuid in request.updates) {

                        // Try to find targeted camera
                        let camera = userCameras.list.find(cam => cam._uuid === uuid);

                        if (camera) {
                            camera.update(request.updates[uuid]);
                        }
                    }
                }
            }
            else if (request.type === "rm") {
                // Delete all user cameras
                if (request.uuid === undefined) {
                    delete self._subscribersCameras[request.userId];
                }
                else {
                    delete self._subscribersCameras[request.userId][uuid];
                }

                // Notify subscriber
                if (self._subscriberOnCameraChange !== null) {
                    self._subscriberOnCameraChange(self._subscribersCameras);
                }
            }
        });
    }

    setOnCamerasChange(callback) {
        this._subscriberOnCameraChange = callback;
    }
    // endregion

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

    // region META GETTERS
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

    getUsername() {
        return this._username;
    }
    // endregion



    update() {
        let currentTime = new Date();

        if (!this._dirty || currentTime - this._lastUpdate < this._updateInterval || this._updateInProgress) {
            return;
        }

        this._lastUpdate = currentTime;
        this._updateInProgress = true;

        let self = this;

        // Implement timeout mechanism
        this._updateCameras(function () {
            self._updateData(function() {
                self._updateInProgress = false;
            });
        });
    }
};