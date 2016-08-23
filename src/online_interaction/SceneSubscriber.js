/**
 * Created by Primoz on 18. 06. 2016.
 */

M3D.SceneSubscriberListener = class {
    constructor(onConnected, onTerminated) {
        this.onConnected = (onConnected) ? onConnected : function() {};
        this.onTerminated = (onTerminated) ? onTerminated : function() {};
    }
};

M3D.SceneSubscriber = class {

    constructor(username, updateListener) {
        this._socket = io();
        this._sessionID = null;
        this._username = username;

        var self = this;
        this._objects = {};
        this._geometries = {};
        this._materials = {};

        this._rootObjects = [];
        this._cameras = {};

        this._updateListener = updateListener;

        // region CAMERAS
        this._updateInProgress = false;

        // Scheduled updates
        this._scheduledCameraUpdates = {};

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

        this._cameraChangeListener = new M3D.UpdateListener(onCameraUpdate);

        this._subscriberOnCameraChange = null;
        // endregion

        //region SOCKET.IO
        this._socket.on("connectResponse", function(response) {
            if (response && response.status === 0) {
                var objectsJson = response.initialData.objects;
                var geometriesJson = response.initialData.geometries;
                var materialsJson = response.initialData.materials;

                // Import the received data, returns reference to all root objects (data may contain more hierarchies or parentless objects)
                self._rootObjects = M3D.Object3D.importHierarchy(objectsJson, geometriesJson, materialsJson);


                // Store reference to all updatable objects in hierarchy for fast access on update
                for (var i = 0; i < self._rootObjects.length; i++) {
                    self._rootObjects[i].traverse(function (object) {
                        self._objects[object._uuid] = object;

                        if (object instanceof M3D.Mesh) {
                            // Meshes also own geometry and material
                            self._geometries[object.geometry._uuid] = object.geometry;
                            self._materials[object.material._uuid] = object.material;
                        }
                    });
                }

                self._socket.emit("sessionCameras", {type: "fetch", sessionId: self._sessionID}, function(response) {

                    // Check if the fetch was successful
                    if (response.status === 0) {
                        var camerasOwners = response.data;

                        // Fetch cameras
                        for (let userId in camerasOwners) {

                            var userCamerasList = camerasOwners[userId].list;

                            // If user does not own the camera array create it
                            if (!self._cameras[userId]) {
                                self._cameras[userId] = {list: [], ownerUsername: response.data[userId].ownerUsername};
                            }

                            // Create cameras
                            for (let uuid in userCamerasList) {
                                self._cameras[userId].list.push(M3D[userCamerasList[uuid].type].fromJson(userCamerasList[uuid]));
                            }
                        }

                        // Notify user
                        if (self._updateListener) {
                            console.log("Successfully connected");
                            self._updateListener.onConnected(response.status, self._rootObjects, self._cameras);
                        }
                    }
                    else {
                        // Notify user
                        console.log("Camera fetch failed with: " + response.status);
                        if (self._updateListener) {
                            self._updateListener.onConnected(response.status, null, null);
                        }
                    }

                });
            }
            else {
                // Notify user
                console.log("Connect failed with status: " + response.status);
                if (self._updateListener) {
                    self._updateListener.onConnected(response.status, null, null);
                }
            }
        });

        this._socket.on("sessionDataUpdate", function(request) {
            var object, geometry, material;
            var newObjects = request.newObjects;
            var updates = request.updates;

            // Parse new objects
            if (newObjects) {
                // Construct newly received geometries if any
                if (newObjects.geometries) {
                    for (var uuid in newObjects.geometries) {
                        self._geometries[uuid] = M3D.Geometry.fromJson(newObjects.geometries[uuid]);
                    }
                }

                // Construct newly received materials if any
                if (newObjects.materials) {
                    for (var uuid in newObjects.materials) {
                        switch (newObjects.materials[uuid].type) {
                            case "MeshPhongMaterial":
                                self._materials[uuid] = M3D.MeshPhongMaterial.fromJson(newObjects.materials[uuid]);
                                break;
                            case "MeshBasicMaterial":
                                self._materials[uuid] = M3D.MeshBasicMaterial.fromJson(newObjects.materials[uuid]);
                                break;
                            case "Material":
                                self._materials[uuid] = M3D.Material.fromJson(newObjects.materials[uuid]);
                                break;
                            default:
                                console.warn("Unknown type of material received. Trying to parse a Material object.");
                                self._materials[uuid] = M3D.Material.fromJson(newObjects.materials[uuid]);
                                break;
                        }
                    }
                }

                // Construct newly received objects if any
                if (newObjects.objects) {
                    for (var uuid in newObjects.objects) {
                        object = newObjects.objects[uuid];
                        var rebuiltObject;

                        if (object.type === "Mesh") {
                            // If the received new object is mesh add geometry and material to it
                            geometry = self._geometries[object.geometryUuid];
                            material = self._materials[object.materialUuid];
                            rebuiltObject = M3D.Mesh.fromJson(object, geometry, material);

                            // Save reference to geometry and material
                            self._geometries[geometry._uuid] = geometry;
                            self._materials[material._uuid] = material;
                        }
                        else {
                            // Standard object rebuilding
                            rebuiltObject = M3D[object.type].fromJson(object);
                        }

                        // Save reference to object
                        self._objects[rebuiltObject._uuid] = rebuiltObject;

                        // Hierarchy modification
                        if (object.parentUuid) {
                            var parent = self._objects[object.parentUuid];

                            if (parent) {
                                parent.children.push(rebuiltObject);
                                rebuiltObject._parent = parent;
                            }
                            else {
                                console.log("Could not find the specified parent! Adding to root objects.")
                                self._rootObjects.push(rebuiltObject);
                            }
                        }
                        else {
                            self._rootObjects.push(rebuiltObject);
                        }
                    }
                }
            }

            // Parse updates
            if (updates) {
                if (updates.objects) {
                    for (var uuid in updates.objects) {
                        object = self._objects[uuid];

                        if (object) {

                            // Check if object is being removed
                            if (updates.objects[uuid].remove === true) {
                                // Remove the object from the hierarchy
                                var currentParent = object.parent;

                                // Remove the modified object from the current parent children
                                if (currentParent) {
                                    currentParent.remove(object);
                                }

                                // Remove from synchronized objects
                                delete self._objects[uuid];

                                // If the removed object is in root objects group.. Remove it
                                for(var i = self._rootObjects.length - 1; i >= 0; i--) {
                                    if(self._rootObjects[i]._uuid === uuid) {
                                        self._rootObjects.splice(i,1);
                                        break;
                                    }
                                }

                                continue;
                            }

                            // Update object
                            object.update(updates.objects[uuid]);

                            // Check if hierarchy modification
                            var newParentUuid = updates.objects[uuid].parentUuid;

                            if (newParentUuid) {
                                var currentParent = object.parent;

                                // Remove the modified object from the current parent children
                                if (currentParent) {
                                    currentParent.remove(object);
                                }

                                // Add a new parent to this object
                                if (self._objects[newParentUuid]) {
                                    self._objects[newParentUuid].add(object);
                                }
                            }
                            else if (newParentUuid === null) {
                                object.parent.remove(object);
                            }
                        }
                    }
                }

                if (updates.geometries) {
                    for (var uuid in updates.geometries) {
                        geometry = self._geometries[uuid];

                        if (geometry) {
                            // Check if the geometry is being removed
                            if (updates.geometries[uuid].remove === true) {
                                delete self._geometries[uuid];
                                continue
                            }

                            geometry.update(updates.geometries[uuid]);
                        }
                    }
                }

                if (updates.materials) {
                    for (var uuid in updates.materials) {
                        material = self._materials[uuid];

                        if (material) {
                            // Check if the material is being removed
                            if (updates.materials[uuid].remove === true) {
                                delete self._materials[uuid];
                                continue
                            }

                            material.update(updates.materials[uuid]);
                        }
                    }
                }
            }
        });

        this._socket.on("sessionCameras", function (request) {
            if (request.type === "add") {

                var userCamerasList = request.data.list;

                // If user does not own the camera array create it
                if (self._cameras[request.userId] === undefined) {
                    self._cameras[request.userId] = {list: [], ownerUsername: request.data.ownerUsername};
                }

                // Create cameras
                for (let uuid in userCamerasList) {
                    var newCamera = M3D[userCamerasList[uuid].type].fromJson(userCamerasList[uuid]);
                    self._cameras[request.userId].list.push(newCamera);

                    // Notify subscriber
                    if (self._subscriberOnCameraChange !== null) {
                        self._subscriberOnCameraChange(self._cameras);
                    }
                }
            }
            else if (request.type === "update") {
                // Fetch user camera list
                var userCameras = self._cameras[request.userId];

                // Update cameras
                if (userCameras !== undefined) {
                    // Iterate through updates
                    for (var uuid in request.updates) {

                        // Try to find targeted camera
                        var camera = userCameras.list.find(cam => cam._uuid === uuid);

                        if (camera) {
                            camera.update(request.updates[uuid]);
                        }
                    }
                }
            }
            else if (request.type === "rm") {
                // Delete all user cameras
                if (request.uuid === undefined) {
                    delete self._cameras[request.userId];
                }
                else {
                    delete self._cameras[request.userId][uuid];
                }

                // Notify subscriber
                if (self._subscriberOnCameraChange !== null) {
                    self._subscriberOnCameraChange(self._cameras);
                }
            }
        });

        this._socket.on("sessionTerminated", function() {
            self._updateListener.onTerminated();
        });
        //endregion
    }

    // region CAMERA HOSTING
    addCameras(cameras, callback) {
        var self = this;

        // Export the cameras
        var camerasJson = {};
        for (var i = 0; i < cameras.length; i++) {
            camerasJson[cameras[i]._uuid] = cameras[i].toJson();
        }

        // Forming request
        var request = {type: "add", sessionId: this._sessionID, cameras: camerasJson};

        // When successfully uploaded add change listeners
        this._socket.emit("sessionCameras", request, function () {
            for (var i = 0; i < cameras.length; i++) {
                cameras[i].addOnChangeListener(self._cameraChangeListener, false);
            }

            if (callback) {
                callback();
            }
        });
    }

    _updateCameras(callback) {
        if (Object.keys(this._scheduledCameraUpdates).length > 0) {
            var request = {type: "update", sessionId: this._sessionID, updates: this._scheduledCameraUpdates};

            this._scheduledCameraUpdates = {};
            this._socket.emit("sessionCameras", request, callback);
        }
        else {
            callback();
        }
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

    getSocketID() {
        if (this._socket !== null) {
            return this._socket.id;
        }
        else {
            return null;
        }
    }

    getSessionID() {
        return this._sessionID
    }

    getUsername() {
        return this._username;
    }

    subscribe(sessionID) {
        this._sessionID = sessionID;
        this._socket.emit("session", {type: "join", sessionId: sessionID, username: this._username});
    }

    unsubscribe() {
        this._socket.disconnect();

        this._objects = {};
        this._geometries = {};
        this._materials = {};

        this._rootObjects = [];
        this._cameras = [];
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
            self._updateInProgress = false;
        });
    }
};