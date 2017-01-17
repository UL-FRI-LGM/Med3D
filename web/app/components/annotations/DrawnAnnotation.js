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

        /** Line representation of the drawing. This is a list of arrays where each sub-array represents a line that was
        drawn on the image */
        this._lines = [];

        this._texture = new M3D.Texture();
        this._texture.applyConfig(M3D.RenderPass.DEFAULT_RGBA_TEXTURE_CONFIG);

        /**
         * Determines if the annotation is actually drawn and beeing drawn to.
         */
        this._renderAnnotation = true;
    }

    get cameraPosition() { return this._cameraPosition; }
    get cameraRotation() { return this._cameraRotation; }
    get texture() { return this._texture; }
    get title() { return this._title; }
    set title(value) { this._title = value; }
};