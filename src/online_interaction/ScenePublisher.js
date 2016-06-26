/**
 * Created by Primoz on 18. 06. 2016.
 */

M3D.ScenePublisher = class {
    
    constructor(scene, camera, updateInterval) {

        var self = this;

        this._socket = io();

        this._socket.on('connect', function() {
            console.log(self._socket.id);
        });

        this._scene = scene;
        this._camera = camera;

        // Scheduled updates
        this._scheduledObjectsUpdates = {};
        this._scheduledMaterialsUpdates = {};
        this._scheduledGeometriesUpdates = {};

        this._newObjects = {objects: {}, geometries: {}, materials: {}};
        this._synchronizedObjects = new Set();


        var onObjectUpdate = function(update) {
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
            var changes = update.changes;
            var object = changes.objectRef;

            if (object === undefined || self._synchronizedObjects.has(update.uuid)) {
                // No object reference was given (Object was removed from hierarchy)
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

                // TODO: If hierarchy is added import whole hierarchy not just the given object
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
            }
        };

        var onMaterialUpdate = function(update) {
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
    }

    startPublishing() {
        var data = {objects: {}, geometries: {}, materials: {}, camera: {}};

        // Recursively the shared scene
        this._scene.exportHierarchyToJson(data);

        // Export the camera
        var cameraJson = this._camera.toJson();
        data.objects[cameraJson.uuid] = cameraJson;

        // Form the request and forward it to server via socket.io
        var request = {type: "create", data: data};
        this._socket.emit("session", request);

        // Add change listeners to the given scene and camera
        this._scene.addOnChangeListener(this._changeListener, true);
        this._camera.addOnChangeListener(this._changeListener, false);
    }


    publishUpdates() {
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
        this._socket.emit("sessionUpdate", updateData);

        // Reset scheduled updates
        this._scheduledObjectsUpdates = {};
        this._scheduledMaterialsUpdates = {};
        this._scheduledGeometriesUpdates = {};
        this._newObjects = {objects: {}, geometries: {}, materials: {}, camera: {}};
    }
};