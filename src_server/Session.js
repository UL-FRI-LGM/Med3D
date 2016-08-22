/**
 * Created by Primoz on 15.6.2016.
 */

"use strict";

var Session = class {

    constructor(host) {
        this._cameras = {};
        this._annotations = {};
        this._objects = {};
        this._geometries = {};
        this._materials = {};
        this._host = host;
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


    // CAMERAS
    addCameras(userId, cameras) {
        if (!this._cameras[userId]) {
            this._cameras[userId] = cameras;
            console.log("Created camera list for user: " + userId + ".")
        }
        else {
            for (let uuid in cameras) {
                console.log("Added new camera!");
                this._cameras[userId][uuid] = cameras[uuid];
            }
        }
    }

    rmCameras(userId) {
        delete this._cameras[userId];
    }

    updateCameras(userId, update) {
        var cameras = this._cameras[userId];

        // No camera is bound to that user
        if (!cameras) {
            return;
        }

        var camera;

        for (var uuid in update) {
            var updateEntry = update[uuid];

            camera = cameras[uuid];

            // If camera exists. Update it.
            if (camera !== undefined) {
                // Object entry update
                for (var prop in updateEntry) {
                    camera[prop] = updateEntry[prop];
                }
            }
        }
    }

    fetchCameras() {
        return this._cameras;
    }

    // ANNOTATIONS
    addAnnotations(userId, annotations) {
        if (!this._annotations[userId]) {
            this._annotations[userId] = annotations;
            console.log("Created annotations list for user: " + userId + ".")
        }
        else {
            for (var i = 0; i < annotations.length; i++) {
                console.log("Added new annotation!");
                this._annotations[userId].push(annotations[i]);
            }
        }
    }

    rmAnnotations(userId, index) {
        var annotationsList = this._annotations[userId];

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