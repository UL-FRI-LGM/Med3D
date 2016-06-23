/**
 * Created by Primoz on 18. 06. 2016.
 */

M3D.ScenePublisher = class {
    
    constructor(scene, camera, updateInterval) {

        var self = this;
        var selftest = this;

        this._socket = io();

        this._socket.on('connect', function() {
            console.log(self._socket.id);
        });

        this._scene = scene;
        this._camera = camera;
        this._updateInterval = updateInterval;

        this._scheduledObjectsUpdates = {};
        this._scheduledMaterialsUpdates = {};
        this._scheduledGeometriesUpdates = {};
        this._cameraUpdate = {};

        this._newObjects = {objects: {}, geometries: {}, materials: {}, camera: {}};
        this._synchronizedObjects = new Set();

        this._timer = null;

        var onObjectUpdate = function(update) {
            // Update previous update entry
            var changes = update.changes;

            if (update.uuid !== self._camera._uuid) {
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
            }
            else {
                for (var prop in changes) {
                    self._cameraUpdate[prop] = changes[prop];
                }
            }
        };

        var onHierarchyUpdate = function(update) {
            var changes = update.changes;
            var object = changes.objectRef;

            if (object === undefined || self._synchronizedObjects.has(update.uuid)) {
                delete changes.objectRef;

                self._scheduledObjectsUpdates[update.uuid].parentUuid = changes.parentUuid;
            } else {
                self._newObjects.objects[object._uuid] = object.toJson();
                self._synchronizedObjects.add(object._uuid);

                if (object.type === "Mesh") {
                    self._newObjects.geometries[object.geometry._uuid] = object.geometry.toJson();
                    self._newObjects.materials[object.material._uuid] = object.material.toJson();
                    self._synchronizedObjects.add(object.geometry._uuid);
                    self._synchronizedObjects.add(object.material._uuid);
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

        this._scene.exportHierarchyToJson(data);
        data.camera = this._camera.toJson();

        var request = {type: "create", data: data};
        this._socket.emit("session", request);

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

        if (Object.keys(this._cameraUpdate).length > 0) {
            updateData.updates.camera = this._cameraUpdate;
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

        if (updateEmpty) {
            return;
        }

        // Post the update
        this._socket.emit("sessionUpdate", updateData);

        this._scheduledObjectsUpdates = {};
        this._scheduledMaterialsUpdates = {};
        this._scheduledGeometriesUpdates = {};
        this._cameraUpdate = {};
        this._newObjects = {objects: {}, geometries: {}, materials: {}, camera: {}};
    }
};