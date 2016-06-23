/**
 * Created by Primoz on 18. 06. 2016.
 */

M3D.SceneSubscriberListener = class {
    constructor(onConnected) {
        this.onConnected = (onConnected) ? onConnected : function() {};
    }
};

M3D.SceneSubscriber = class {

    constructor(updateListener) {
        this._socket = io();

        var self = this;
        this._objects = {};
        this._geometries = {};
        this._materials = {};
        this._rootObjects = [];

        this._scene = null;
        this._camera = null;

        this._scheduledUpdates = [];

        this._updateListener = updateListener;

        //region SOCKET.IO
        this._socket.on("connectResponse", function(response) {
            if (response && response.status === 0) {
                var objects = response.initialData.objects;
                var geometries = response.initialData.geometries;
                var materials = response.initialData.materials;
                var camera = response.initialData.camera;

                self._rootObjects = M3D.Object3D.importHierarchy(objects, geometries, materials);
                self._scene = self._rootObjects[0];

                self._camera = null;
                // Check if the camera was given
                if (camera.type === "PerspectiveCamera") {
                    self._camera = M3D.PerspectiveCamera.fromJson(camera);
                }

                // Store reference to all updatable objects in hierarchy for fast access.
                for (var i = 0; i < self._rootObjects.length; i++) {
                    self._rootObjects[i].traverse(function (object) {
                        self._objects[object._uuid] = object;

                        if (object instanceof M3D.Mesh) {
                            self._geometries[object.geometry._uuid] = object.geometry;
                            self._materials[object.material._uuid] = object.material;
                        }
                    });
                }
            }
            else {
                console.log("Connect failed with status: " + response.status);
            }

            if (self._updateListener) {
                self._updateListener.onConnected(response.status, self._scene, self._camera);
            }
        });

        this._socket.on("sessionUpdate", function(request) {
            //self._scheduledUpdates.push(request);
            var updates = request.updates;

            // Parse updates
            if (updates) {

                if (updates.objects) {
                    for (var uuid in updates.objects) {
                        var object = self._objects[uuid];

                        if (object) {
                            object.update(updates.objects[uuid]);
                        }
                    }
                }

                if (updates.geometries) {
                    for (var uuid in updates.geometries) {
                        var geometry = self._geometries[uuid];

                        if (geometry) {
                            geometry.update(updates.geometries[uuid]);
                        }
                    }
                }

                if (updates.materials) {
                    for (var uuid in updates.materials) {
                        var material = self._materials[uuid];

                        if (material) {
                            material.update(updates.materials[uuid]);
                        }
                    }
                }

                if (updates.camera) {
                    self._camera.update(updates.camera);
                }
            }
        });
        //endregion
    }

    // TODO: Check if it is okay to modify the scene asynchronously
    /*
    update() {
        var length = this._scheduledUpdates.length;

        // Nothing to update
        if (length === 0) {
            return;
        }

        var data = this._scheduledUpdates[0];

        // Merge all of the received updates
        for (var i = 1; i < length; i++) {
            data = mergeRecursive(data, this._scheduledUpdates[i]);
        }

        this._scheduledUpdates.splice(0, length);

        var updates = data.updates;

        // Parse updates
        if (updates) {
            if (updates.objects) {
                //session.updateObjects(updates.objects);
            }

            if (updates.geometries) {
                //session.updateGeometries(updates.geometries);
            }

            if (updates.materials) {
                //session.updateMaterials(updates.materials);
            }

            if (updates.camera) {
                this._camera.update(updates.camera);
            }
        }
    }

    mergeRecursive(obj1, obj2) {
        for (var prop in obj2) {
            try {
                // Property in destination object set; update its value.
                if (obj2[prop].constructor == Object) {
                    obj1[prop] = MergeRecursive(obj1[prop], obj2[prop]);
                } else {
                    obj1[prop] = obj2[prop];
                }
            } catch(e) {
                // Property in destination object not set; create it and set its value.
                obj1[prop] = obj2[prop];
            }
        }

        return obj1;
    }
    */

    subscribeTo(sessionId) {
        this._socket.emit("session", {type: "join", sessionId: sessionId});
    }

    get isDirty() { return this._scheduledUpdates.length != 0; }
};