/**
 * Created by Primoz on 15.6.2016.
 */

// TODO: Document this ASAP

Session = class {

    constructor(host, username) {
        this._cameras = {};
        this._annotations = {};
        this._objects = {};
        this._geometries = {};
        this._materials = {};
        this._host = host;
        this._username = username;
        this._initialized = false;
    }

    initialize(data) {
        this._objects = data.objects;
        this._geometries = data.geometries;
        this._materials = data.materials;
        this._initialized = true;
    }

    get cameras() { return this._cameras; }
    get objects() { return this._objects; }
    get geometries() { return this._geometries; }
    get materials() { return this._materials; }
    get camera() { return this._camera; }
    get host() { return this._host; }
    get initialData() { return {cameras: this._cameras, objects: this._objects, geometries: this._geometries, materials: this._materials}}
    get ownerUsername() { return this._username; }


    // CAMERAS
    addCameras(userId, username, cameras) {
        if (!this._cameras[userId]) {
            this._cameras[userId] = { ownerUsername: username, list: cameras };
        }
        else {
            for (let uuid in cameras) {
                this._cameras[userId].list[uuid] = cameras[uuid];
            }
        }
    }

    rmCamera(userId, uuid) {
        if (this._cameras[userId] !== undefined) {
            let camerasList = this._cameras[userId].list;

            if (uuid !== undefined) {
                delete camerasList[uuid];
            }
            else {
                delete this._cameras[userId];
            }
        }
    }

    updateCameras(userId, update) {
        let entry = this._cameras[userId];

        // No camera is bound to that user
        if (!entry) {
            return;
        }

        let camera;

        for (let uuid in update) {
            let updateEntry = update[uuid];

            camera = entry.list[uuid];

            // If camera exists. Update it.
            if (camera !== undefined) {
                // Object entry update
                for (let prop in updateEntry) {
                    camera[prop] = updateEntry[prop];
                }
            }
        }
    }

    fetchCameras(userId) {
        let allCameras = {};

        for (let id in this._cameras) {
            if (id !== userId) {
                allCameras[id] = this._cameras[id];
            }
        }
        return allCameras;
    }

    // ANNOTATIONS
    addAnnotations(userId, username, annotations) {
        if (!this._annotations[userId]) {
            this._annotations[userId] = {ownerUsername: username, list: annotations};
        }
        else {
            for (let i = 0; i < annotations.length; i++) {
                this._annotations[userId].list.push(annotations[i]);
            }
        }
    }

    rmAnnotation(userId, index) {
        if (this._annotations[userId] !== undefined) {
            let annotationsList = this._annotations[userId].list;

            if (annotationsList) {
                if (index !== undefined) {
                    annotationsList.splice(index, 1);
                }
                else {
                    delete this._annotations[userId];
                }
            }
        }
    }

    fetchAnnotations(userId) {
        let allAnnotations = {};

        for (let id in this._annotations) {
            if (id !== userId) {
                allAnnotations[id] = this._annotations[id];
            }
        }

        return allAnnotations;
    }

    clearAnnotations() {
        this._annotations = {};
    }

    // SCENE DATA
    addObjects(newObjects) {
        for (let uuid in newObjects) {
            this._objects[uuid] = newObjects[uuid];
        }
    }

    addMaterials(newMaterials) {
        for (let uuid in newMaterials) {
            this._materials[uuid] = newMaterials[uuid];
        }
    }

    addGeometries(newGeometries) {
        for (let uuid in newGeometries) {
            this._geometries[uuid] = newGeometries[uuid];
        }
    }

    // TODO: Security
    updateObjects(update) {
        for (let uuid in update) {
            let updateEntry = update[uuid];

            // Check if the object has been deleted
            if (updateEntry.remove === true) {
                delete this._objects[uuid];
                continue;
            }

            let object = this._objects[uuid];

            // Object entry update
            for (let prop in updateEntry) {
                object[prop] = updateEntry[prop];
            }
        }
    }

    updateGeometries(update) {
        for (let uuid in update) {
            let updateEntry = update[uuid];

            // Check if the object has been deleted
            if (updateEntry.remove === true) {
                delete this._geometries[uuid];
                continue;
            }

            let geometry = this._geometries[uuid];

            // Object entry update
            for (let prop in updateEntry) {
                geometry[prop] = updateEntry[prop];
            }
        }
    }

    updateMaterials(update) {
        for (let uuid in update) {
            let updateEntry = update[uuid];

            // Check if the object has been deleted
            if (updateEntry.remove === true) {
                delete this._materials[uuid];
                continue;
            }

            let material = this._materials[uuid];

            // Object entry update
            for (let prop in updateEntry) {
                material[prop] = updateEntry[prop];
            }
        }
    }

};

module.exports = Session;