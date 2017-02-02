/**
 * Created by Primoz on 16. 01. 2017.
 */

DrawnAnnotation = class{

    constructor(title, cameraPosition, cameraRotation) {

        // Store the title of the annotation
        this._title = title;

        // Stores the camera position and rotation to fixate the rendered scene to a single frame
        this._cameraPosition = cameraPosition;
        this._cameraRotation = cameraRotation;

        // Drawing layers
        this._layers = [];

        this._layerCounter = 1;

        // Add initial layer
        this.addLayer();

        // Index of the selected layer
        this._drawLayer = this._layers[0];
    }

    addLayer() {
        let layer = new DrawingLayer("Layer " + this._layerCounter++);

        this._layers.unshift(layer);
    }

    removeLayer(layer) {
        let index = this._layers.indexOf(layer);

        if (this._drawLayer === layer) {
            this._drawLayer = null;
        }

        this._layers.splice(index, 1);
    }

    emulateOwner() {
        let layer = new DrawingLayer("Layer " + this._layerCounter++, "John Doe");

        this._layers.unshift(layer);
    }

    get cameraPosition() { return this._cameraPosition; }
    get cameraRotation() { return this._cameraRotation; }
    get layers() { return this._layers; }
    get title() { return this._title; }
    set title(value) { this._title = value; }

    set drawLayer(layer) { this._drawLayer = layer; }
    get drawLayer() { return this._drawLayer; }

};