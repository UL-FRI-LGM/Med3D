/**
 * Created by Primoz on 18. 06. 2016.
 */

M3D.SceneSubscriberListener = class {
    constructor(onConnected, onTerminated, onNewObject) {
        this.onConnected = (onConnected) ? onConnected : function() {};
        this.onTerminated = (onTerminated) ? onTerminated : function() {};
        this.onNewObject = (onNewObject) ? onNewObject : function () {};
    }
};

M3D.SceneSubscriber = class {

    constructor(username, updateListener) {
        let self = this;

        // Subscriber meta data
        this._sessionID = null;
        this._username = username;

        // Maps {uuid -> object reference}
        this._objects = {};
        this._geometries = {};
        this._materials = {};

        // Root hierarchy objects
        this._rootObjects = [];
        // Camera map {uuid -> camera}
        this._cameras = {};

        // Store the given update listener
        this._updateListener = updateListener;

        // region CAMERAS
        this._updateInProgress = false;

        // Scheduled updates
        this._scheduledCameraUpdates = {};

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
                for (let prop in changes) {
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
        this._socketManager = M3D.SocketManager.instance;

        if (!this._socketManager.isConnectionOpen) {
            this._socketManager.connectToServer();
        }

        // Create new socket subscriber and enroll it into the socket manager
        this._socketSubscriber = new M3D.SocketSubscriber();
        this._socketManager.addSocketSubscriber(this._socketSubscriber);

        /**
         * RESPONSE:
         * {
         *      status: 0 - success
         *      initialData: Current session data
         * }
         */
        this._socketSubscriber.addEventCallback("joinSessionResponse", function(response) {

            if (response && response.status === 0) {
                let objectsJson = response.initialData.objects;
                let geometriesJson = response.initialData.geometries;
                let materialsJson = response.initialData.materials;

                // Import the received data, returns reference to all root objects (data may contain more hierarchies or parentless objects)
                self._rootObjects = M3D.Object3D.importHierarchy(objectsJson, geometriesJson, materialsJson);

                // Map the scene hierarchy to more easily update the data
                for (let i = 0; i < self._rootObjects.length; i++) {
                    self._rootObjects[i].traverse(function (object) {
                        self._objects[object._uuid] = object;

                        if (object instanceof M3D.Mesh) {
                            // Meshes also own geometry and material
                            self._geometries[object.geometry._uuid] = object.geometry;
                            self._materials[object.material._uuid] = object.material;
                        }
                    });
                }

                // Fetch cameras
                self._socketManager.emit("sessionCameras", {type: "fetch"}, function(response) {

                    // Check if the fetch was successful
                    if (response.status === 0) {
                        let camerasOwners = response.data;

                        // Fetch cameras
                        for (let userId in camerasOwners) {

                            let userCamerasList = camerasOwners[userId].list;

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

        /**
         * REQUEST:
         * {
         *      newObjects: Object that were added to the session
         *      updates: Updates for existing objects
         * }
         */
        this._socketSubscriber.addEventCallback("sessionDataUpdate", function(request) {
            let object, geometry, material;
            let newObjects = request.newObjects;
            let updates = request.updates;

            // Parse new objects
            if (newObjects) {
                // Construct newly received geometries if any
                if (newObjects.geometries) {
                    for (let uuid in newObjects.geometries) {
                        self._geometries[uuid] = M3D.Geometry.fromJson(newObjects.geometries[uuid]);
                    }
                }

                // Construct newly received materials if any
                if (newObjects.materials) {
                    for (let uuid in newObjects.materials) {
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
                    for (let uuid in newObjects.objects) {
                        object = newObjects.objects[uuid];
                        let rebuiltObject;

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
                            let parent = self._objects[object.parentUuid];

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

                    self._updateListener.onNewObject();
                }
            }

            // Parse updates
            if (updates) {
                if (updates.objects) {
                    for (let uuid in updates.objects) {
                        object = self._objects[uuid];

                        if (object) {

                            // Check if object is being removed
                            if (updates.objects[uuid].remove === true) {
                                // Remove the object from the hierarchy
                                let currentParent = object.parent;

                                // Remove the modified object from the current parent children
                                if (currentParent) {
                                    currentParent.remove(object);
                                }

                                // Remove from synchronized objects
                                delete self._objects[uuid];

                                // If the removed object is in root objects group.. Remove it
                                for(let i = self._rootObjects.length - 1; i >= 0; i--) {
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
                            let newParentUuid = updates.objects[uuid].parentUuid;

                            if (newParentUuid) {
                                let currentParent = object.parent;

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
                    for (let uuid in updates.geometries) {
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
                    for (let uuid in updates.materials) {
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

        /**
         * REQUEST:
         * {
         *      type: "add", "update", "rm"
         *      ...
         * }
         */
        this._socketSubscriber.addEventCallback("sessionCameras", function (request) {
            if (request.type === "add") {

                let userCamerasList = request.data.list;

                // If user does not own the camera array create it
                if (self._cameras[request.userId] === undefined) {
                    self._cameras[request.userId] = {list: [], ownerUsername: request.data.ownerUsername};
                }

                // Create cameras
                for (let uuid in userCamerasList) {
                    let newCamera = M3D[userCamerasList[uuid].type].fromJson(userCamerasList[uuid]);
                    self._cameras[request.userId].list.push(newCamera);

                    // Notify subscriber
                    if (self._subscriberOnCameraChange !== null) {
                        self._subscriberOnCameraChange(self._cameras);
                    }
                }
            }
            else if (request.type === "update") {

                // Fetch user camera list
                let userCameras = self._cameras[request.userId];

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

        /**
         * Called when the session is terminated
         */
        this._socketSubscriber.addEventCallback("sessionTerminated", function() {
            self._updateListener.onTerminated();
        });
        //endregion
    }

    // region CAMERA HOSTING
    addCameras(cameras, callback) {
        let self = this;

        // Export the cameras
        let camerasJson = {};
        for (let i = 0; i < cameras.length; i++) {
            camerasJson[cameras[i]._uuid] = cameras[i].toJson();
        }

        // Forming request
        let request = {type: "add", cameras: camerasJson};

        // When successfully uploaded add change listeners
        this._socketManager.emit("sessionCameras", request, function () {
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
            let request = {type: "update", updates: this._scheduledCameraUpdates};

            this._scheduledCameraUpdates = {};
            this._socketManager.emit("sessionCameras", request, callback);
        }
        else {
            callback();
        }
    }

    setOnCamerasChange(callback) {
        this._subscriberOnCameraChange = callback;
    }
    // endregion

    getSessionID() {
        return this._sessionID
    }

    getUsername() {
        return this._username;
    }

    subscribe(sessionID) {
        this._sessionID = sessionID;
        this._socketManager.emit("session", {type: "join", sessionId: sessionID, username: this._username});
    }

    unsubscribe() {
        // TODO
        //this._socket.disconnect();

        this._objects = {};
        this._geometries = {};
        this._materials = {};

        this._rootObjects = [];
        this._cameras = [];
    }


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
            self._updateInProgress = false;
        });
    }
};