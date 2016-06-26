/**
 * Created by Primoz on 15.6.2016.
 */

"use strict";

var Session = class {

    constructor(host) {
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

    get objects() { return this._objects; }
    get geometries() { return this._geometries; }
    get materials() { return this._materials; }
    get camera() { return this._camera; }
    get host() { return this._host; }
    get initialData() { return {objects: this._objects, geometries: this._geometries, materials: this._materials}}


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
            var material = this._materials[uuid];

            // Object entry update
            for (var prop in updateEntry) {
                material[prop] = updateEntry[prop];
            }
        }
    }

};

module.exports = Session;