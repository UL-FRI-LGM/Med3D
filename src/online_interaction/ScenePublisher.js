/**
 * Created by Primoz on 18. 06. 2016.
 */

M3D.ScenePublisher = class {
    
    constructor(scene, camera, onConnectionChange) {

        var self = this;

        this._scene = scene;
        this._camera = camera;
        this._updateInProgress = false;

        // Scheduled updates
        this._scheduledObjectsUpdates = {};
        this._scheduledMaterialsUpdates = {};
        this._scheduledGeometriesUpdates = {};

        this._newObjects = {objects: {}, geometries: {}, materials: {}};
        this._synchronizedObjects = new Set();

        //TODO: Set update interval based on the server/publisher latency
        this._updateInterval = 16; // Allow update 10 times a second
        this._lastUpdate = null;
        this._dirty = false;

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

            if (object === undefined || self._synchronizedObjects.has(update.uuid)) {
                // No object reference was given (Object was removed in the hierarchy)
                delete changes.objectRef;

                // Schedule parent change update
                var scheduledUpdate = self._scheduledObjectsUpdates[update.uuid];
                if (scheduledUpdate) {
                    scheduledUpdate.parentUuid = changes.parentUuid;
                } else {
                    self._scheduledObjectsUpdates[update.uuid] = { parentUuid: changes.parentUuid }
                }
            } else {
                // New object not previously seen was added to the hierarchy
                self._newObjects.objects[object._uuid] = object.toJson();
                self._synchronizedObjects.add(object._uuid);

                // Start listening for changes on this object
                object.addOnChangeListener(this, false);

                // If the object is mesh also synchronize material and geometry
                if (object.type === "Mesh") {
                    if (!self._synchronizedObjects.has(object.geometry._uuid)) {
                        self._newObjects.geometries[object.geometry._uuid] = object.geometry.toJson();
                        self._synchronizedObjects.add(object.geometry._uuid);
                    }
                    if (!self._synchronizedObjects.has(object.material._uuid)) {
                        self._newObjects.materials[object.material._uuid] = object.material.toJson();
                        self._synchronizedObjects.add(object.material._uuid);
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

        this._changeListener = new M3D.UpdateListener(onObjectUpdate, onHierarchyUpdate, onMaterialUpdate, onGeometryUpdate);

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

            self._uploadScene(serverCallback);
        });
    }

    stopPublishing() {
        this._socket.disconnect();

        // Destroy scene changes listener
        this._changeListener = null;

        // Clear any cached data
        this._scheduledObjectsUpdates = {};
        this._scheduledMaterialsUpdates = {};
        this._scheduledGeometriesUpdates = {};

        this._newObjects = {objects: {}, geometries: {}, materials: {}};
        this._synchronizedObjects = new Set();
    }

    _uploadScene(serverCallback) {
        var data = {objects: {}, geometries: {}, materials: {}};

        // Recursively the shared scene
        this._scene.exportHierarchyToJson(data);

        // Export the camera
        var cameraJson = this._camera.toJson();
        data.objects[cameraJson.uuid] = cameraJson;

        // Form the request and forward it to server via socket.io
        var request = {type: "create", data: data};

        this._socket.emit("session", request, serverCallback);

        // Add change listeners to the given scene and camera
        this._scene.addOnChangeListener(this._changeListener, true);
        this._camera.addOnChangeListener(this._changeListener, false);
    }

    _publishUpdates(serverCallback) {
        var updateData = {updates: {}, newObjects: {}};

        var updateEmpty = true;

        // Add object updates
        if (Object.keys(this._scheduledObjectsUpdates).length > 0) {
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
            return;
        }

        // Forward the request to the server
        this._socket.emit("sessionUpdate", updateData, serverCallback);

        // Reset scheduled updates
        this._scheduledObjectsUpdates = {};
        this._scheduledMaterialsUpdates = {};
        this._scheduledGeometriesUpdates = {};
        this._newObjects = {objects: {}, geometries: {}, materials: {}, camera: {}};
        this._dirty = false;
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
        this._publishUpdates(function() {
            self._updateInProgress = false;
        });
    }
};