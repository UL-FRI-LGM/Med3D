/**
 * Created by Primoz on 16. 01. 2017.
 */

DrawnAnnotation = class {

    constructor(title, cameraPosition, cameraRotation, owner = null) {

        // Unique identifier
        this._uuid = THREE.Math.generateUUID();

        // Store the title of the annotation
        this._title = title;

        // Stores the camera position and rotation to fixate the rendered scene to a single frame
        this._cameraPosition = cameraPosition;
        this._cameraRotation = cameraRotation;

        // Drawing layers
        this._layers = [];

        this._layerCounter = 0;

        this._owner = owner;

        // Selected drawing layer
        this._drawLayer = null;

        this._changeRecorder = null;
    }

    createChangeRecorder() {
        this._changeRecorder = new DrawnAnnotation.ChangeRecorder(this._layers);
        return this._changeRecorder;
    }

    removeChangeRecorder() {
        this._changeRecorder = null;
        for (let i = 0; i < this._layers.length; i++) {
            this._layers[i].removeChangeRecorder();
        }
    }

    addLayer() {
        let layer = new DrawingLayer("Layer " + this._layerCounter++);

        this._layers.unshift(layer);

        if (this._changeRecorder != null) {
            this._changeRecorder.onAddLayer(layer);
        }

        this._drawLayer = layer;
    }

    removeLayer(layer) {
        let index = this._layers.indexOf(layer);

        if (this._drawLayer === layer) {
            this._drawLayer = null;
        }

        this._layers.splice(index, 1);

        if (this._changeRecorder != null) {
            this._changeRecorder.onRmLayer(layer);
        }
    }

    emulateOwner() {
        let layer = new DrawingLayer("Layer " + this._layerCounter++, "John Doe");

        this._layers.unshift(layer);
    }

    toJson() {
        let json = {
            title: this._title,
            cameraPosition: this._cameraPosition.toArray(),
            cameraRotation: this._cameraRotation.toArray(),
            layers: []
        };

        for (let i = 0; i < this._layers.length; i++) {
            json.layers.push(this._layers[i].toJson());
        }

        return json;
    }

    static fromJson(json, uuid, owner) {
        let position = new THREE.Vector3();
        let rotation = new THREE.Vector3();

        position.fromArray(json.cameraPosition);
        rotation.fromArray(json.cameraRotation)

        let annotation = new DrawnAnnotation(json.title, position, rotation, owner);
        annotation._uuid = uuid;

        for (let i = 0; i < json.layers.length; i++) {
            annotation._layers.push(DrawingLayer.fromJson(json.layers[i], owner));
        }

        return annotation;
    }

    findLayerByUuid(uuid) {
        for (let i = 0; i < this._layers.length; i++) {
            if (this._layers[i]._uuid === uuid) {
                return this._layers[i];
            }
        }

        return null;
    }

    update(updateData, owner) {
        // Update title
        if (updateData.hasOwnProperty("title")) {
            this._title = updateData.title;
        }

        // Add new layers
        if (updateData.hasOwnProperty("newLayers")) {
            for (let i = 0; i < updateData.newLayers.length; i++) {
                this._layers.unshift(DrawingLayer.fromJson(updateData.newLayers[i], owner));
            }
        }

        // Remove annotations that are marked for removal
        if (updateData.hasOwnProperty("removedLayers")) {
            for (let i = this._layers.length - 1; i >= 0; i--) {
                if (updateData.removedLayers.indexOf(this._layers[i]._uuid) > -1) {
                    this._layers.splice(i, 1);
                }
            }
        }

        // Apply layer changes
        if (updateData.hasOwnProperty("layersChanges")) {
            for (let layerUuid in updateData.layersChanges) {
                let layer = this.findLayerByUuid(layerUuid);

                if (layer != null) {
                    layer.update(updateData.layersChanges[layerUuid]);
                }
            }
        }
    }

    get owner() { return this._owner; }
    get changeRecorder() { return this._changeRecorder; }
    get cameraPosition() { return this._cameraPosition; }
    get cameraRotation() { return this._cameraRotation; }
    get layers() { return this._layers; }
    get title() { return this._title; }
    set title(value) {
        this._title = value;

        if (this._changeRecorder != null) {
            this._changeRecorder.onAnnotationTitleChange(value);
        }
    }

    set drawLayer(layer) { this._drawLayer = layer; }
    get drawLayer() { return this._drawLayer; }
};

DrawnAnnotation.ChangeRecorder = class {

    constructor(layers) {
        /**
        {
            title: "changed title",
            newLayers: [],
            removedLayers: [uuid]
            layersChanges: {uuid -> {changes}},
        }
        */
        this._changes = {};
        this._layers = layers;

        for (let i = 0; i < this._layers.length; i++) {
            if (this._layers[i].owner == null) {
                this._layers[i].createChangeRecorder();
            }
        }
    }

    disownLayers() {
        for (let i = 0; i < this._layers.length; i++) {
            this._layers[i]._owner = null;
        }
    }

    /**
     * Should be called when the annotation title is changed
     * @param newTitle
     */
    onAnnotationTitleChange(newTitle) {
        this._changes.title = newTitle;
    }

    /**
     * Should be called when a new layer is added to the annotation
     * @param newLayer
     */
    onAddLayer(newLayer) {
        if (newLayer.owner != null) {
            return;
        }

        newLayer.createChangeRecorder();

        if (this._changes.hasOwnProperty("newLayers")) {
            this._changes.newLayers.unshift(newLayer.toJson());
        }
        else {
            this._changes.newLayers = [newLayer.toJson()];
        }
    }

    /**
     * Should be called when a layer is removed from the annotation
     * @param layer
     */
    onRmLayer(layer) {
        layer.removeChangeRecorder();

        // If this was a newly added layer remove it from changes
        if (this._changes.hasOwnProperty("newLayers")) {
            for (let i = 0; i < this._changes.newLayers.length; i++) {
                if (this._changes.newLayers.uuid === layer._uuid) {
                    this._changes.splice(i, 1);
                    return;
                }
            }
        }

        // If this was not a new layer mark it for removal
        if (this._changes.hasOwnProperty("removedLayers")) {
            this._changes.removedLayers.push(layer._uuid);
        }
        else {
            this._changes.removedLayers = [layer._uuid];
        }
    }

    getAndClearChanges() {

        let layersChanges = {};
        let dirty = false;

        // Check the layers for changes
        for (let i = 0; i < this._layers.length; i++) {
            if (this._layers[i].changeRecorder != null) {
                let changes = this._layers[i].changeRecorder.getAndClearChanges();
                if (changes != null) {
                    layersChanges[this._layers[i]._uuid] = changes;
                    dirty = true;
                }
            }
        }

        // If there were any layer changes add them to annotation changes
        if (dirty) {
            this._changes.layersChanges = layersChanges;
        }

        // If there are no changes do not bother returning anything
        if (Object.keys(this._changes).length === 0) {
            return null;
        }

        // Clear and return the changes
        let tmp = this._changes;
        this._changes = {};

        return tmp;
    }
};