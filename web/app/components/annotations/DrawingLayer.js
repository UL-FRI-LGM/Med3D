/**
 * Created by Primoz on 30. 01. 2017.
 */

DrawingLayer = class {

    constructor(title, owner = null) {
        this._title = title;

        /** Line representation of the drawing. This is a list of arrays where each sub-array represents a line that was
         drawn on the image */
        this._lines = [];

        /** Drawing layer texture */
        this._texture = new M3D.Texture();
        this._texture.applyConfig(M3D.RenderPass.DEFAULT_RGBA_TEXTURE_CONFIG);

        this._isDisplayed = true;

        /** If null. Current user is the owner, otherwise the owner name is specified in this variable. */
        this._owner = owner;

        this._dirty = false;
    }


    /**
     * Creates new line entry with the given THREE.Vector2 Vector is converted to array for easier JSON packing.
     * @param {THREE.Vector2} point Starting point of the line
     * @param thickness Line thickness specified as float
     * @param hardness Line hardness specified as float
     * @param color Line color
     */
    createNewLineEntry(point, thickness, hardness, color) {
        let line = {points: point.toArray(),
            thickness: thickness,
            hardness: hardness,
            color: color.toArray()};

        this._lines.push(line);
    }

    addLinePoint(point) {
        this._lines[this._lines.length - 1]["points"].push.apply(this._lines[this._lines.length - 1]["points"], point.toArray());
    }

    undo() {
        if (this._lines.length > 0) {
            this._lines.pop();
            this._dirty = true;
        }
    }

    get texture() { return this._texture; }
    get lines() { return this._lines; }
    get title() { return this._title; }
    get isDisplayed() { return this._isDisplayed; }
    get owner() { return this._owner; }
    get dirty() { return this._dirty; }

    set title(value) { this._title = value; }
    set displayed(value) { this._isDisplayed = value; }
    set owner(value) { this._owner = value; }
    set dirty(value) { this._dirty = value; }
};