/**
 * Created by Primoz on 15.6.2016.
 */

"use strict";

var Session = class {

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
            console.log("Created camera list for user: " + userId + ".")
        }
        else {
            for (let uuid in cameras) {
                console.log("Added new camera!");
                this._cameras[userId].list[uuid] = cameras[uuid];
            }
        }
    }

    rmCameras(userId, uuid) {
        if (this._cameras[userId] !== undefined) {
            var camerasList = this._cameras[userId].list;

            if (uuid !== undefined) {
                delete camerasList[uuid];
            }
            else {
                delete this._cameras[userId];
            }
            console.log("Removed Camera!");
        }
    }

    updateCameras(userId, update) {
        var entry = this._cameras[userId];

        // No camera is bound to that user
        if (!entry) {
            return;
        }

        var camera;

        for (var uuid in update) {
            var updateEntry = update[uuid];

            camera = entry.list[uuid];

            // If camera exists. Update it.
            if (camera !== undefined) {
                // Object entry update
                for (var prop in updateEntry) {
                    camera[prop] = updateEntry[prop];
                }
            }
        }
    }

    fetchCameras(userId) {
        var allCameras = {};

        for (var id in this._cameras) {
            if (id !== userId) {
                allCameras[id] = this._cameras[id];
            }
        }

        console.log("Fetched cameras!");
        return allCameras;
    }

    // ANNOTATIONS
    addAnnotations(userId, username, annotations) {
        if (!this._annotations[userId]) {
            this._annotations[userId] = {ownerUsername: username, list: annotations};
            console.log("Created annotations list for user: " + userId + ".")
        }
        else {
            for (var i = 0; i < annotations.length; i++) {
                console.log("Added new annotation!");
                this._annotations[userId].list.push(annotations[i]);
            }
        }
    }

    rmAnnotations(userId, index) {
        if (this._annotations[userId] !== undefined) {
            var annotationsList = this._annotations[userId].list;

            if (annotationsList) {
                if (index !== undefined) {
                    annotationsList.splice(index, 1);
                }
                else {
                    delete this._annotations[userId];
                }
                console.log("Removed annotation!");
            }
        }
    }

    fetchAnnotations(userId) {
        var allAnnotations = {};

        for (var id in this._annotations) {
            if (id !== userId) {
                allAnnotations[id] = this._annotations[id];
            }
        }

        console.log("Fetched annotations!");
        return allAnnotations;
    }

    clearAnnotations() {
        console.log("Clear annotations!");
        this._annotations = {};
    }

    // SCENE DATA
    addObjects(newObjects) {
        for (var uuid in newObjects) {
            this._objects[uuid] = newObjects[uuid];
        }
    }

    addMaterials(newMaterials) {
        for (var uuid in newMaterials) {
            this._materials[uuid] = newMaterials[uuid];
        }
    }

    addGeometries(newGeometries) {
        for (var uuid in newGeometries) {
            this._geometries[uuid] = newGeometries[uuid];
        }
    }

    // TODO: Security
    updateObjects(update) {
        for (var uuid in update) {
            var updateEntry = update[uuid];

            // Check if the object has been deleted
            if (updateEntry.remove === true) {
                console.log("Removed object");
                delete this._objects[uuid];
                continue;
            }

            var object = this._objects[uuid];

            // Object entry update
            for (var prop in updateEntry) {
                object[prop] = updateEntry[prop];
            }
        }
    }

    updateGeometries(update) {
        for (var uuid in update) {
            var updateEntry = update[uuid];

            // Check if the object has been deleted
            if (updateEntry.remove === true) {
                console.log("Removed geometry");
                delete this._geometries[uuid];
                continue;
            }

            var geometry = this._geometries[uuid];

            // Object entry update
            for (var prop in updateEntry) {
                geometry[prop] = updateEntry[prop];
            }
        }
    }

    updateMaterials(update) {
        for (var uuid in update) {
            var updateEntry = update[uuid];

            // Check if the object has been deleted
            if (updateEntry.remove === true) {
                console.log("Removed material");
                delete this._materials[uuid];
                continue;
            }

            var material = this._materials[uuid];

            // Object entry update
            for (var prop in updateEntry) {
                material[prop] = updateEntry[prop];
            }
        }
    }

};

module.exports = Session;