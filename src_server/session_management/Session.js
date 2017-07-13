/**
 * Created by Primoz on 15.6.2016.
 */

// TODO: Document this ASAP

Session = class {

    constructor(host, username) {
        this._cameras = {};
        this._annotations = {};
        this._drawnAnnotations = {};
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

    // DRAWN ANNOTATIONS
    addDrawnAnnotations(userId, username, annotations) {
        if (!this._drawnAnnotations.hasOwnProperty(userId)) {
            this._drawnAnnotations[userId] = {ownerUsername: username, annotations: annotations};
        }
        else {
            for (let uuid in annotations) {
                this._drawnAnnotations[userId].annotations[uuid] = annotations[uuid];
            }
        }
    }

    _findLayer(layers, uuid) {
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].uuid === uuid) {
                return layers[i];
            }
        }

        return null;
    }

    updateDrawnAnnotations(userId, updates) {
        let userAnn = this._drawnAnnotations[userId];

        for (let annUuid in updates) {
            let annotation = userAnn.annotations[annUuid];
            let update = updates[annUuid];

            // Update title
            if (update.hasOwnProperty("title")) {
                annotation.title = update.title;
            }

            // Add new layers
            if (update.hasOwnProperty("newLayers")) {
                Array.prototype.push.apply(annotation.layers, update.newLayers);
            }

            // Remove annotations that are marked for removal
            if (update.hasOwnProperty("removedLayers")) {
                for (let i = annotation.layers.length - 1; i >= 0; i--) {
                    if (update.removedLayers.indexOf(annotation.layers[i].uuid) > -1) {
                        annotation.layers.splice(i, 1);
                    }
                }
            }

            // Apply layer changes
            if (update.hasOwnProperty("layersChanges")) {
                for (let layerUuid in update.layersChanges) {
                    let layerChanges = update.layersChanges[layerUuid];
                    let layer = this._findLayer(annotation.layers, layerUuid);

                    // Check if the layer was found
                    if (layer != null) {
                        // Update layer title
                        if (layerChanges.hasOwnProperty("title")) {
                            layer.title = layerChanges.title;
                        }

                        // Remove lines that were marked for removal
                        let num = 0;

                        if (layerChanges.hasOwnProperty("removedLines")) {
                            for (let i = layer.lines.length - 1; i >= 0; i--) {
                                if (layer.removedLines.indexOf(layer.lines[i].uuid) > 0) {
                                    layer.lines.splice(i, 1);
                                    num++;

                                    if (num >= layer.removedLines.length) {
                                        break;
                                    }
                                }
                            }
                        }

                        // Add new lines
                        if (layerChanges.hasOwnProperty("newLines")) {
                            Array.prototype.push.apply(layer.lines, layerChanges.newLines);
                        }

                        // Add new line points
                        num = 0;

                        if (layerChanges.hasOwnProperty("newLinePoints")) {
                            let numLinePoints = Object.keys(layerChanges.newLinePoints).length;

                            for (let i = layer.lines.length - 1; i >= 0; i--) {
                                if (layerChanges.newLinePoints.hasOwnProperty(layer.lines[i].uuid)) {
                                    Array.prototype.push.apply(layer.lines[i].points, layerChanges.newLinePoints[layer.lines[i].uuid]);
                                    num++;

                                    if (num >= numLinePoints) {
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    rmDrawnAnnotation(userId, uuid) {
        if (this._drawnAnnotations[userId] !== undefined) {
            let userDrawnAnnotations = this._drawnAnnotations[userId].annotations;

            if (userDrawnAnnotations) {
                if (uuid !== undefined) {
                    delete userDrawnAnnotations[uuid];
                }
                else {
                    delete this._drawnAnnotations[userId];
                }
            }
        }
    }

    fetchDrawnAnnotations(userId) {
        let allDrawnAnn = {};

        for (let id in this._drawnAnnotations) {
            if (id !== userId) {
                allDrawnAnn[id] = this._drawnAnnotations[id];
            }
        }

        return allDrawnAnn;
    }

    clearDrawnAnnotations() {
        this._drawnAnnotations = {};
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