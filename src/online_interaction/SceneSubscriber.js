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

    constructor(updateListener) {
        this._socket = io();

        var self = this;
        this._objects = {};
        this._geometries = {};
        this._materials = {};

        this._scenes = [];
        this._cameras = [];

        this._updateListener = updateListener;
        //region SOCKET.IO
        this._socket.on("connectResponse", function(response) {
            if (response && response.status === 0) {
                var objects = response.initialData.objects;
                var geometries = response.initialData.geometries;
                var materials = response.initialData.materials;

                // Import the received data, returns reference to all root objects (data may contain more hierarchies or parentless objects)
                var rootObjects = M3D.Object3D.importHierarchy(objects, geometries, materials);


                // Store reference to all updatable objects in hierarchy for fast access on update
                for (var i = 0; i < rootObjects.length; i++) {
                    rootObjects[i].traverse(function (object) {
                        self._objects[object._uuid] = object;

                        if (object instanceof M3D.Mesh) {
                            // Meshes also own geometry and material
                            self._geometries[object.geometry._uuid] = object.geometry;
                            self._materials[object.material._uuid] = object.material;
                        }
                        else if (object instanceof M3D.Camera) {
                            // Cameras bookkeeping
                            self._cameras.push(object);
                        }
                        else if (object instanceof M3D.Scene) {
                            // Scenes bookkeeping
                            self._scenes.push(object);
                        }
                    });
                }
            }
            else {
                console.log("Connect failed with status: " + response.status);
            }

            if (self._updateListener) {
                self._updateListener.onConnected(response.status, self._scenes, self._cameras);
            }
        });

        this._socket.on("sessionUpdate", function(request) {
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
                            self._materials[geometry._uuid] = material;
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
                                self._scenes.push(rebuiltObject);
                            }
                        }
                        else {
                            self._scenes.push(rebuiltObject);
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
                            geometry.update(updates.geometries[uuid]);
                        }
                    }
                }

                if (updates.materials) {
                    for (var uuid in updates.materials) {
                        material = self._materials[uuid];

                        if (material) {
                            material.update(updates.materials[uuid]);
                        }
                    }
                }
            }
        });

        this._socket.on("sessionTerminated", function() {
            self._updateListener.onTerminated();
        });
        //endregion
    }

    subscribe(sessionId) {
        this._socket.emit("session", {type: "join", sessionId: sessionId});
    }

    unsubscribe() {
        this._socket.disconnect();

        this._objects = {};
        this._geometries = {};
        this._materials = {};

        this._scenes = [];
        this._cameras = [];
    }
};